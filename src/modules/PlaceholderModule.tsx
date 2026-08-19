"use client";

interface Props {
  name: string;
  description?: string;
  icon?: string;
}

export default function PlaceholderModule({ name, description, icon = "🚧" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <div className="text-5xl mb-4 opacity-70">{icon}</div>
      <h2 className="text-white text-xl font-bold mb-2">{name}</h2>
      <p className="text-gray-500 text-sm max-w-sm">
        {description || "This module is available in the full version. Core modules (Dashboard, Inventory, Customers, Suppliers, POS, AI Decisions, Cash Flow) are fully functional."}
      </p>
    </div>
  );
}
