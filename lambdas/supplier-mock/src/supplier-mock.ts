import { Deps } from "./deps";

export default function createHandler(deps: Deps) {
  return async function handler() {
    deps.logger.info("Hello from the supplier mock lambda!");
  };
}
