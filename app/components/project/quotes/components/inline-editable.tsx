import React, { useState, useEffect } from 'react';

interface InlineEditableProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  style?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
}

const InlineEditable: React.FC<InlineEditableProps> = ({
  value,
  onChange,
  className,
  style,
  inputClassName,
  inputStyle,
}) => {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setEditing(false);
    onChange(localValue);
  };

  return editing ? (
    <input
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      autoFocus
      className={inputClassName}
      style={inputStyle}
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      className={className}
      style={{ cursor: 'pointer', ...style }}
    >
      {value || <span style={{ color: 'gray' }}>Click to edit</span>}
    </span>
  );
};

export default InlineEditable;
