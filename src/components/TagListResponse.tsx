import Response from '@components/Response';

interface TagListResponseProps {
  tags: string[];
  variant: 'context' | 'project';
}

const TagListResponse = ({ tags, variant }: TagListResponseProps) => (
  <Response>
    {tags.map((tag, i) => (
      <p key={i} className={variant === 'context' ? 'text-cyan-400' : 'text-blue-400'}>
        {tag}
      </p>
    ))}
  </Response>
);

export default TagListResponse;
