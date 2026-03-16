export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_APP_URL || // Set this to your production URL in Vercel
    process.env.NEXT_PUBLIC_VERCEL_URL || // Automatically set by Vercel for preview deployments
    'http://localhost:3000/';
  
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  
  return url;
};
