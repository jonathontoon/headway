import { useSelector } from "react-redux";
import type { RootState } from "../types";

export const useAppSelector = useSelector.withTypes<RootState>();
