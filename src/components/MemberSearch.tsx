'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Loader2 } from 'lucide-react';

interface Member {
  _id: string;
  memberId: string;
  fullName: string;
  phoneNumber: string;
  status: string;
  idNumber?: string;
}

interface MemberSearchProps {
  value?: string;
  onChange: (memberId: string, member: Member | null) => void;
  placeholder?: string;
  excludeIds?: string[];
  filterStatus?: 'active' | 'inactive' | 'all';
}

export function MemberSearch({ 
  value, 
  onChange, 
  placeholder = 'Search member...', 
  excludeIds = [],
  filterStatus = 'active'
}: MemberSearchProps) {
  const [storeMembers, setStoreMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch('/api/members?status=active&limit=100');
        const data = await res.json();
        if (data.members) {
          setStoreMembers(data.members);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    let synced = storeMembers;
    if (filterStatus === 'active') {
      synced = synced.filter((m) => m.status === 'active');
    } else if (filterStatus === 'inactive') {
      synced = synced.filter((m) => m.status === 'inactive');
    }
    synced = synced.filter((m) => !excludeIds.includes(m._id));
    return synced;
  }, [storeMembers, filterStatus, excludeIds]);

  const selectedMember = useMemo(() => {
    if (!value || storeMembers.length === 0) return null;
    return storeMembers.find((m) => m.memberId === value || m._id === value) || null;
  }, [value, storeMembers]);

  function filterMembers(searchQuery: string) {
    const q = searchQuery.toLowerCase();
    let source = filteredMembers;
    
    if (!q) {
      return source;
    }
    
    return source.filter((m) => {
      const searchMatch = 
        m.fullName.toLowerCase().includes(q) ||
        m.memberId.toLowerCase().includes(q) ||
        m.phoneNumber.includes(q) ||
        (m.idNumber && m.idNumber.includes(q));
      return searchMatch;
    });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const searchVal = e.target.value;
    setQuery(searchVal);
    setIsOpen(true);
  }

  function handleSelect(member: Member) {
    setQuery('');
    setIsOpen(false);
    // Pass _id (MongoDB ObjectId) instead of memberId for database references
    onChange(member._id, member);
  }

  function handleClear() {
    setQuery('');
    onChange('', null);
    inputRef.current?.focus();
  }

  const displayMembers = query ? filterMembers(query) : filteredMembers;

  if (loading) {
    return (
      <div className="flex items-center justify-center border rounded px-3 py-2 bg-gray-50">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading members...</span>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      {selectedMember ? (
        <div className="flex items-center justify-between border rounded px-3 py-2 bg-green-50">
          <div>
            <div className="font-medium">{selectedMember.fullName}</div>
            <div className="text-sm text-gray-500">
              {selectedMember.memberId} • {selectedMember.phoneNumber}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleSearchChange}
            onFocus={() => {
              setIsOpen(true);
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          
          {isOpen && displayMembers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {displayMembers.slice(0, 20).map((member) => (
                <button
                  key={member._id}
                  type="button"
                  onClick={() => handleSelect(member)}
                  className="w-full text-left px-3 py-2 hover:bg-green-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{member.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {member.memberId} • {member.phoneNumber}
                  </div>
                </button>
              ))}
              {displayMembers.length > 20 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  Showing 20 of {filteredMembers.length} members
                </div>
              )}
            </div>
          )}
          
          {isOpen && query && displayMembers.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
              No members found matching &quot;{query}&quot;
            </div>
          )}
          
          {isOpen && !query && displayMembers.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg p-4 text-center text-gray-500">
              No members available
            </div>
          )}
        </div>
      )}
    </div>
  );
}