import { z } from "zod";

const envSchema = z.object({
  ENVIRONMENT: z.enum(["development", "test", "staging", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  COOKIE_SECRET: z.string().optional(),
});

const env = envSchema.parse(process.env);

// Strict validation for COOKIE_SECRET in non-development environments
if (env.ENVIRONMENT !== "development" && !env.COOKIE_SECRET) {
  throw new Error(`CRITICAL: COOKIE_SECRET is mandatory in ${env.ENVIRONMENT} environment.`);
}

class AppConfigService<ConfigType> {
  private config: ConfigType;
  constructor(inputFig: ConfigType) {
    this.config = inputFig;
  }
  isInitialized() {
    return !!this.config;
  }
  initialize() {
    this.config = this.config;
  }
  getAppConfig() {
    return this.config;
  }
}

export const configService = new AppConfigService({
  environment: env.ENVIRONMENT,
  database: { url: env.DATABASE_URL },
  sessionSecret: env.COOKIE_SECRET || "development-only-insecure-secret",
});
