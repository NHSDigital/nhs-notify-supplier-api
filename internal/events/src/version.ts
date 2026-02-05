import { version } from "../package.json";

export { version as VERSION } from "../package.json";

export const [MAJOR_VERSION] = version.split(".");
