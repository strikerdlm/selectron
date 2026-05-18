import { describe, it, expect } from "vitest";
import { SelectronError } from "@/engine/errors";

describe("SelectronError", () => {
  it("preserves code, message, and details", () => {
    const err = new SelectronError("E_BAD_SCORE", "score out of range", { criterion: "x", value: 11 });
    expect(err.name).toBe("SelectronError");
    expect(err.code).toBe("E_BAD_SCORE");
    expect(err.message).toBe("score out of range");
    expect(err.details).toEqual({ criterion: "x", value: 11 });
  });

  it("is instanceof Error", () => {
    expect(new SelectronError("E_BAD_SCORE", "x")).toBeInstanceOf(Error);
  });

  it("accepts E_BAD_MISSION", () => {
    const e = new SelectronError("E_BAD_MISSION", "unknown mission type");
    expect(e.code).toBe("E_BAD_MISSION");
  });

  it("accepts E_BAD_CONDITION", () => {
    const e = new SelectronError("E_BAD_CONDITION", "unknown condition kind");
    expect(e.code).toBe("E_BAD_CONDITION");
  });

  it("accepts E_BAD_PRIOR", () => {
    const e = new SelectronError("E_BAD_PRIOR", "tau out of [0,1]: 1.2");
    expect(e.code).toBe("E_BAD_PRIOR");
  });
});
