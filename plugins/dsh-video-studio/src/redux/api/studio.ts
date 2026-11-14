import { createApi } from '@reduxjs/toolkit/query/react';
import type { RenderResult, StudioLaunchResult, StudioState } from '@/types';
import { baseService } from './_baseQuery';

export interface RenderArgs {
  slug: string;
  draft?: boolean;
}

export const studioApi = createApi({
  reducerPath: 'studioApi',
  baseQuery: baseService(),
  tagTypes: ['State'],
  endpoints: (build) => ({
    getState: build.query<StudioState, void>({
      query: () => ({ url: '/api/state', cache: 'no-store' }),
      providesTags: ['State'],
    }),
    startRender: build.mutation<RenderResult, RenderArgs>({
      query: (body) => ({ url: '/api/render', method: 'POST', body }),
      invalidatesTags: ['State'],
    }),
    openStudio: build.mutation<StudioLaunchResult, { slug: string }>({
      query: (body) => ({ url: '/api/studio', method: 'POST', body }),
    }),
  }),
});

export const { useGetStateQuery, useStartRenderMutation, useOpenStudioMutation } = studioApi;
