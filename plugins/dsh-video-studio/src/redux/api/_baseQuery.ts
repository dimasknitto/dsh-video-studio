import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Base URL mengikuti lokasi panel di host: semua route plugin berada di
 * `/video-studio` relatif terhadap `document.baseURI`.
 *
 * Header `x-video-studio` wajib untuk semua POST; dikirim di semua request
 * supaya tidak ada endpoint yang lupa.
 */
export function baseService() {
  return fetchBaseQuery({
    baseUrl: new URL('video-studio', document.baseURI).toString(),
    prepareHeaders: (headers) => {
      headers.set('x-video-studio', '1');
      return headers;
    },
  });
}
