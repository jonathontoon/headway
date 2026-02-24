import { memo } from "react";
import Response from "./Response";

interface TagListResponseProps {
  tags: string[];
  variant: "context" | "project";
}

const cls = (v: "context" | "project") =>
  v === "context" ? "text-cyan-400" : "text-blue-400";

const TagListResponse = memo(({ tags, variant }: TagListResponseProps) => (
  <Response>
    {tags.map((tag) => (
      <p key={tag} className={cls(variant)}>
        {tag}
      </p>
    ))}
  </Response>
));

export default TagListResponse;
