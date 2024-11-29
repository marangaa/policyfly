import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Navigation } from "@/components/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Document Automation System",
  description:
    "Streamline your document workflows with automated template processing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="pt-16">{children}</main>
          <Toaster position="top-right" />
        </div>
      </body>
    </html>
  );
}
