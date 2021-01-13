import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import base64url from 'base64url';
import type { NextApiRequest, NextApiResponse } from 'next';

enum DirectiveType {
  Boolean,
  Numeric,
}

type BooleanDirective = {
  name: string;
  type: DirectiveType.Boolean;
  default: boolean;
};
type NumericDirective = {
  name: string;
  type: DirectiveType.Numeric;
  default: number | null;
  min: number;
  max: number;
};

type Directive = BooleanDirective | NumericDirective;

const supportedDirectives: Directive[] = [
  {
    name: 'immutable',
    type: DirectiveType.Boolean,
    default: false,
  },
  {
    name: 'must-revalidate',
    type: DirectiveType.Boolean,
    default: false,
  },
  {
    name: 'no-cache',
    type: DirectiveType.Boolean,
    default: false,
  },
  {
    name: 'no-store',
    type: DirectiveType.Boolean,
    default: false,
  },
  {
    name: 'public',
    type: DirectiveType.Boolean,
    default: false,
  },
  {
    name: 's-maxage',
    type: DirectiveType.Numeric,
    default: null,
    min: 0,
    max: 60 * 60 * 24 * 365,
  },
  {
    name: 'stale-while-revalidate',
    type: DirectiveType.Boolean,
    default: false,
  },
  {
    name: 'max-age',
    type: DirectiveType.Numeric,
    default: null,
    min: 0,
    max: 60 * 60 * 24 * 365,
  },
];

const USAGE = `
Supported query parameters:

  url (mandatory) - a Base64URL-encoded URL of the resource to be cached

  max-age, s-maxage - a number between 0 and 31536000

  immutable, must-revalidate, no-cache,
  no-store, public, stale-while-revalidate - specify the parameter name to enable the directive (no need to provide a value)

e.g. https://cache-it-with.vercel.app/api/cache?url=aHR0cHM6Ly9zb3VyY2UudW5zcGxhc2guY29tL2RhaWx5&s-maxage=86400&stale-while-revalidate`;

const get = (value: string | string[] | undefined): string | undefined => {
  if (value === undefined) return undefined;
  else return typeof value === 'string' ? value : value[value.length - 1];
};

export default async ({ query }: NextApiRequest, res: NextApiResponse) => {
  try {
    const errors: string[] = [];
    const directives: string[] = [];
    for (const directive of supportedDirectives) {
      const value = get(query[directive.name]);
      switch (directive.type) {
        case DirectiveType.Boolean:
          if (value !== undefined || directive.default)
            directives.push(directive.name);
          break;
        case DirectiveType.Numeric:
          if (value !== undefined) {
            if (
              /^\d+$/.test(value) &&
              Number(value) >= directive.min &&
              Number(value) <= directive.max
            ) {
              directives.push(`${directive.name}=${value}`);
            } else {
              errors.push(
                `'${directive.name}' must be a number between ${directive.min} and ${directive.max}`
              );
            }
          } else if (directive.default !== null) {
            directives.push(`${directive.name}=${directive.default}`);
          }
          break;
        default:
          break;
      }
    }

    if (errors.length > 0) throw new Error(errors.join('; '));

    const url = base64url.decode(get(query.url));
    const axiosResponse = await axios.get(url, {
      responseType: 'stream',
      adapter: httpAdapter,
    });

    if (directives.length > 0)
      res.setHeader('Cache-Control', directives.join(', '));
    res.setHeader('Content-Type', axiosResponse.headers['content-type']);

    axiosResponse.data.pipe(res);
  } catch (error) {
    res.status(500).send(`Error(s): ${error.message}.\n${USAGE}`);
  }
};
