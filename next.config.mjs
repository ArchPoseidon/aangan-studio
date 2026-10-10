/** @type {import('next').NextConfig} */
export default {
  serverExternalPackages: ["@electric-sql/pglite"],
  outputFileTracingIncludes: { "/**": ["./public/projects/**/*", "./db/schema.sql"] },
};
