import { useEffect } from "react";
import { useRefresh } from "./RefreshContext";

const GlobalClickRefresh = () => {
  const { triggerRefresh } = useRefresh();

  useEffect(() => {
    const handleClick = () => {
      triggerRefresh(['all']);
    };
    document.addEventListener("click", handleClick, true); // true = capture phase, catches all clicks

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [triggerRefresh]);

  return null;
};

export default GlobalClickRefresh; 