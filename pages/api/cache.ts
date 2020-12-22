import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    query: { url },
  } = req;

  if (!url || typeof url === 'object')
    return res.status(400).json({
      error:
        'specify a single url parameter, e.g. https:/voulez-vous-cacher-avec-moi.vercel.app/api/cache?url=',
    });

  const axiosResponse = await axios.get(url, {
    responseType: 'stream',
    adapter: httpAdapter,
  });

  res.setHeader(
    'cache-control',
    's-maxage=1, stale-while-revalidate, max-age=60'
  );
  res.setHeader('content-type', axiosResponse.headers['content-type']);
  axiosResponse.data.pipe(res);
};
