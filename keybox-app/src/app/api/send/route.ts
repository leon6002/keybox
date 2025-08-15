import { EmailTemplate } from "@/components/email/email-template";
import { Resend } from "resend";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return Response.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Parse request body for dynamic email data (optional)
    let emailData: any = { firstName: "John" };
    try {
      const body = await request.json();
      emailData = { ...emailData, ...body };
    } catch {
      // Use default data if no body provided
    }

    console.log("Sending email with data:", emailData);

    const { data, error } = await resend.emails.send({
      // For testing, use the Resend test domain until you verify your own domain
      from:
        process.env.RESEND_FROM ||
        "The PandaKeybox Team <support@pandakeybox.com>", // Change to "noreply@pandakeybox.com" after domain verification
      to: [emailData.to || "gulongchen1@gmail.com"], // Allow dynamic recipient
      subject: emailData.subject || "Welcome to PandaKeyBox",
      react: EmailTemplate({ firstName: emailData.firstName }),
    });

    if (error) {
      console.error("Resend API error:", error);
      return Response.json(
        {
          error: "Failed to send email",
          details: error,
        },
        { status: 500 }
      );
    }

    console.log("Email sent successfully:", data);
    return Response.json({
      success: true,
      data,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
