import { redirect } from "next/navigation";

export default function Home() {
  // Server-side SEO placeholder
  redirect("/gacha");
  return (
    <main>
      <h1>Uma Musume Gacha Simulator & Probability Tools</h1>
      <p>
        Calculate your odds, simulate pulls, and optimize your strategy for Uma
        Musume gacha events.
      </p>
    </main>
  );
}
