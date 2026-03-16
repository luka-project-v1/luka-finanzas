import { headers } from 'next/headers';

export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000/';

  // If we're in a request context (Server Action/SSR), try to get the host from headers
  try {
    const host = headers().get('host');
    if (host) {
      url = host.includes('localhost') ? `http://${host}` : `https://${host}`;
    }
  } catch (e) {
    // Falls back to env variables if headers() is called outside of request context
  }
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`;
  
  console.log('Generated Redirect URL Base:', url);
  return url;
};
