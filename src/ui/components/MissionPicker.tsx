import type { AnalogMission } from "../../types/risk";

export function MissionPicker(props: {
  missions: AnalogMission[];
  selected: AnalogMission | null;
  onChange: (m: AnalogMission) => void;
}) {
  return (
    <select
      className="px-3 py-2 border rounded-md bg-white"
      value={props.selected?.id ?? ""}
      onChange={(e) => {
        const m = props.missions.find((mm) => mm.id === e.target.value);
        if (m) props.onChange(m);
      }}
    >
      <option value="">— select analog mission —</option>
      {props.missions.map((m) => (
        <option key={m.id} value={m.id}>
          {m.id} ({m.durationDays}d, n={m.crewSize})
        </option>
      ))}
    </select>
  );
}
