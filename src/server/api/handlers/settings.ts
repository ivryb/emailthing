import { z } from "zod";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { organizations, users } from "@/server/db/schema";
import nodemailer from "nodemailer";

export const settingsRouter = createTRPCRouter({
  isSetup: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user || !ctx.session.user.id) {
      throw new Error("User not found or user ID missing in session context");
    }

    if (!ctx.session.user.orgId) {
      throw new Error("Organization ID missing in session context");
    }

    const setup = await ctx.db.query.organizations
      .findFirst({
        columns: { smtp_username: true, smtp_password: true, region: true },
        where: eq(organizations.id, ctx.session.user.orgId),
      })
      .execute();

    if (
      setup?.region !== null &&
      setup?.smtp_username !== null &&
      setup?.smtp_password !== null
    ) {
      return {
        isSetup: true,
        region: setup?.region,
        smtp_username: setup?.smtp_username,
      };
    } else {
      return {
        isSetup: false,
      };
    }
  }),

  verifySetup: protectedProcedure
    .input(
      z.object({
        region: z.string(),
        smtp_username: z.string(),
        smtp_password: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.user || !ctx.session.user.id) {
        throw new Error("User not found or user ID missing in session context");
      }

      if (!ctx.session.user.orgId) {
        throw new Error("Organization ID missing in session context");
      }

      const transporter = nodemailer.createTransport({
        host: `email-smtp.${input.region}.amazonaws.com`,
        port: 465,
        secure: true,
        auth: {
          user: input.smtp_username,
          pass: input.smtp_password,
        },
      });

      try {
        await transporter.verify();

        await ctx.db
          .update(organizations)
          .set({
            region: input.region,
            smtp_username: input.smtp_username,
            smtp_password: input.smtp_password,
          })
          .where(eq(organizations.id, ctx.session.user.orgId))
          .execute();

        return {
          status: "success",
          message: "SMTP credentials are valid, setup complete.",
        };
      } catch (error) {
        throw new Error(
          "SMTP credentials are invalid, please check and try again.",
        );
      }
    }),
});
