export type Criterion = {
  id: string;
  family: string;
  label: string;
  description: string;
  instrument: string;
  scale: { min: number; max: number };
  higherIsBetter: boolean;
  citations: string[];
};
