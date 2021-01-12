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
    name: 'maxage',
    type: DirectiveType.Numeric,
    default: null,
    min: 0,
    max: 60 * 60 * 24 * 365,
  },
];

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
      }
    }

    if (errors.length > 0) throw new Error(`Error(s): ${errors.join('; ')}.`);

    let url = base64url.decode(get(query.url));
    const axiosResponse = await axios.get(url, {
      responseType: 'stream',
      adapter: httpAdapter,
    });

    if (directives.length > 0)
      res.setHeader('Cache-Control', directives.join(', '));
    res.setHeader('Content-Type', axiosResponse.headers['content-type']);

    axiosResponse.data.pipe(res);
  } catch (error) {
    res.status(500).send(`${error.message}`);

    // Supported query parameters:

    //   url (required) - a Base64URL-encoded URL of the resource to be cached

    //   ${supportedDirectives
    //     // .filter<NumericDirective>(({ type }) => type === DirectiveType.Numeric)
    //     .filter<NumericDirective>((d) => d.type === DirectiveType.Numeric)
    //     .map(({ name, min, max }) => `${name} - a number between ${min} and ${max}`)
    //     .join('\n  ')}

    //   boolean - specify the parameter name only
    //   ${supportedDirectives
    //     .filter(({ type }) => type === DirectiveType.Boolean)
    //     .map(({ name }) => name)
    //     .join(', ')}
    //     `);
  }
};
