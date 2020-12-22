import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const {
      query: { url, maxAge: maxAgeOverride },
    } = req;

    if (!url || typeof url === 'object')
      return res
        .status(400)
        .send(
          'Specify a single url parameter, e.g. https:/voulez-vous-cacher-avec-moi.vercel.app/api/cache?url=https://www.rspcasa.org.au/wp-content/uploads/2019/01/Adopt-a-cat-or-kitten-from-RSPCA.jpg'
        );

    const axiosResponse = await axios.get(url, {
      responseType: 'stream',
      adapter: httpAdapter,
    });

    const maxAge =
      typeof maxAgeOverride === 'string' && /^\d+$/.test(maxAgeOverride)
        ? Number(maxAgeOverride)
        : 60;

    res.setHeader(
      'cache-control',
      `s-maxage=1, stale-while-revalidate, max-age=${maxAge}`
    );

    res.setHeader('content-type', axiosResponse.headers['content-type']);

    axiosResponse.data.pipe(res);
  } catch (error) {
    res.status(500).send(error.message);
  }
};
