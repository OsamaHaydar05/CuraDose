import "./globals.css";
import { ThemeProvider } from "../components/theme-provider";

export const metadata = {
    title: "CuraDose",
    description: "Smart Medication, Better Health",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body>
        <ThemeProvider>{children}</ThemeProvider>
        </body>
        </html>
    );
}