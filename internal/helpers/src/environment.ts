import { z } from "zod";

/**
 * Deployment / execution environment identifier.
 * Intentionally liberal; constrain in callers as needed.
 */
const $Environment = z.string().meta({
  title: "Environment",
  description: "The environment in which the configuration has effect",
  examples: ["dev", "int", "prod"],
});

export default $Environment;
