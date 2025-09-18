import type { State, Observation } from "../shared/contracts/observation";
export function reduce(state: State, obs: Observation): State {
  if (obs.type === "tick") return { counter: state.counter + 1 };
  if (obs.type === "add" && typeof (obs.payload as any)?.n === "number")
    return { counter: state.counter + Number((obs.payload as any).n) };
  return state;
}
