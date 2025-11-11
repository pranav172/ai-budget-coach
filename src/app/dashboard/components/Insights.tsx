export default function Insights({ tips }: { tips: string[] }) {
    return (
      <ul className="list-disc pl-5 space-y-1">
        {tips.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    );
  }
  