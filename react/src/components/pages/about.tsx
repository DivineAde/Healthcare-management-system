import { Header } from "../header";

export default function About() {
    return (
        <main className="min-h-screen bg-background relative">
                  <div className="relative z-10">
                    <Header />
                    <p className="text-lg text-foreground/60 dark:text-foreground/70 flex items-center justify-center h-screen">
                      Coming soon...
                    </p>
                  </div>
        </main>
    )
}
