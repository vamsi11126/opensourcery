'use client';
import { useState } from 'react';
import { SearchAutocomplete } from '@/components/SearchAutocomplete';
export function SearchBar({ large = false, initialValue = '' }: { large?: boolean; initialValue?: string }): React.JSX.Element { const [value, setValue] = useState(initialValue); return <SearchAutocomplete value={value} onChange={setValue} large={large} />; }
