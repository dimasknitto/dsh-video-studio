import {Config} from '@remotion/cli/config';

// The project being previewed or rendered is passed by video.mjs. Assets are
// referenced from the spec relative to the project folder, so the public dir
// is the project itself rather than a shared global folder.
Config.setPublicDir(process.env.VIDEO_PUBLIC_DIR ?? 'public');
Config.setOverwriteOutput(true);
Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
