import { Panel } from "@/components/ui/panel";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <Panel>
      <p className="font-mono text-sm">SIMULACIÓN · EN PREPARACIÓN</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4">{description}</p>
    </Panel>
  );
}
