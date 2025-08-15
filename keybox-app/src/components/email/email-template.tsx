import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Button,
  Hr,
} from "@react-email/components";

interface EmailTemplateProps {
  firstName: string;
}

export function EmailTemplate({ firstName }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Heading style={h1}>Welcome to PandaKeyBox, {firstName}!</Heading>
            <Text style={text}>
              Thank you for joining PandaKeyBox, your secure password manager.
              We're excited to help you keep your digital life safe and
              organized.
            </Text>
            <Text style={text}>Here's what you can do next:</Text>
            <Text style={text}>
              • Set up your master password for encryption • Install our browser
              extension • Import your existing passwords • Start securing your
              accounts
            </Text>
            <Button style={button} href="https://pandakeybox.com/vault">
              Get Started
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              If you have any questions, feel free to reach out to our support
              team.
              <br />
              Best regards,
              <br />
              The PandaKeyBox Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const section = {
  padding: "0 48px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const button = {
  backgroundColor: "#3b82f6",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "20px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0",
};
