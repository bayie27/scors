import React, { useState } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, ChevronDown, X } from 'lucide-react';

const commandOrgFilter = (valueString, search) => {
  if (!search) return 1;
  const searchLower = search.toLowerCase();
  try {
    const item = JSON.parse(valueString);
    const nameLower = (item.name || '').toLowerCase();
    const codeLower = (item.code || '').toLowerCase();
    let score = 0;
    if (nameLower.includes(searchLower)) {
      score += 100;
      if (nameLower.startsWith(searchLower)) score += 50;
    }
    if (typeof item.code === 'string' && item.code && codeLower.includes(searchLower)) {
      score += 20;
      if (codeLower.startsWith(searchLower)) score += 10;
    }
    return score;
  } catch (e) {
    if (typeof valueString === 'string') {
      return valueString.toLowerCase().includes(searchLower) ? 1 : 0;
    }
    return 0;
  }
};

const FilterPopover = ({
  open,
  onOpenChange,
  organizations,
  venues,
  equipmentList,
  statuses,
  organizationFilters,
  setOrganizationFilters,
  venueFilters,
  setVenueFilters,
  equipmentFilters,
  setEquipmentFilters,
  statusFilters,
  setStatusFilters,
  statusLabelMap,
}) => {
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('organizations'); // For mobile tabs

  const handleClearFilters = () => {
    setOrganizationFilters([]);
    setVenueFilters([]);
    setEquipmentFilters([]);
    setStatusFilters([]);
    setEquipmentSearchTerm('');
  };

  // Mobile view components
  const MobileTabButton = ({ tab, icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === tab 
          ? 'border-primary text-primary' 
          : 'border-transparent text-muted-foreground'
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        {icon}
        <span>{label}</span>
      </div>
    </button>
  );

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'organizations':
        return (
          <div className="mt-4">
            <Command className="border rounded-md" filter={commandOrgFilter}>
              <CommandInput placeholder="Search organization..." />
              <CommandEmpty>No organization found</CommandEmpty>
              <CommandGroup className="max-h-[calc(100vh-250px)] overflow-auto">
                {(organizations || []).map((org) => {
                  const checked = organizationFilters.some(o => o.org_id === org.org_id);
                  return (
                    <CommandItem
                      key={org.org_id}
                      value={JSON.stringify({ name: org.org_name, code: org.org_code || '' })}
                      onSelect={() => {
                        if (checked) {
                          setOrganizationFilters(prev => prev.filter(o => o.org_id !== org.org_id));
                        } else {
                          setOrganizationFilters(prev => [...prev, org]);
                        }
                      }}
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox 
                          checked={checked}
                          id={`org-${org.org_id}`}
                        />
                        <span className="truncate">{org.org_name}</span>
                        {org.org_code && (
                          <span className="text-xs text-muted-foreground ml-auto">{org.org_code}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </div>
        );
      case 'venues':
        return (
          <div className="mt-4">
            <Command className="border rounded-md">
              <CommandInput placeholder="Search venue..." />
              <CommandEmpty>No venue found</CommandEmpty>
              <CommandGroup className="max-h-[calc(100vh-250px)] overflow-auto">
                {(venues || []).map((venue) => {
                  const checked = venueFilters.some(v => v.venue_id === venue.venue_id);
                  return (
                    <CommandItem
                      key={venue.venue_id}
                      value={venue.venue_name}
                      onSelect={() => {
                        if (checked) {
                          setVenueFilters(prev => prev.filter(v => v.venue_id !== venue.venue_id));
                        } else {
                          setVenueFilters(prev => [...prev, venue]);
                        }
                      }}
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox 
                          checked={checked}
                          id={`venue-${venue.venue_id}`}
                        />
                        <span className="truncate">{venue.venue_name}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </div>
        );
      case 'equipment':
        return (
          <div className="mt-4">
            <Command className="border rounded-md">
              <CommandInput
                placeholder="Search equipment..."
                value={equipmentSearchTerm}
                onValueChange={setEquipmentSearchTerm}
              />
              <CommandGroup className="max-h-[calc(100vh-250px)] overflow-auto p-2">
                {(equipmentList || [])
                  .filter(eq =>
                    !equipmentSearchTerm ||
                    eq.equipment_name.toLowerCase().includes(equipmentSearchTerm.toLowerCase())
                  )
                  .map((equipment) => (
                    <div key={equipment.equipment_id} className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id={`equipment-${equipment.equipment_id}`}
                        checked={equipmentFilters.some(eqf => eqf.equipment_id === equipment.equipment_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEquipmentFilters(prev => [...prev, equipment]);
                          } else {
                            setEquipmentFilters(prev => 
                              prev.filter(eqf => eqf.equipment_id !== equipment.equipment_id)
                            );
                          }
                        }}
                      />
                      <label 
                        htmlFor={`equipment-${equipment.equipment_id}`}
                        className="text-sm cursor-pointer truncate"
                      >
                        {equipment.equipment_name}
                      </label>
                    </div>
                  ))}
              </CommandGroup>
            </Command>
          </div>
        );
      case 'status':
        return (
          <div className="mt-4">
            <div className="max-h-[calc(100vh-250px)] overflow-auto border rounded-md p-3">
              {(statuses || []).map((status) => (
                <div key={status.reservation_status_id} className="flex items-center space-x-2 mb-2">
                  <Checkbox 
                    id={`status-${status.reservation_status_id}`}
                    checked={statusFilters.some(st => st.reservation_status_id === status.reservation_status_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilters(prev => [...prev, status]);
                      } else {
                        setStatusFilters(prev => 
                          prev.filter(st => st.reservation_status_id !== status.reservation_status_id)
                        );
                      }
                    }}
                  />
                  <label 
                    htmlFor={`status-${status.reservation_status_id}`}
                    className="text-sm cursor-pointer w-full text-gray-900 truncate"
                  >
                    {statusLabelMap[status.reservation_status_id] || status.name || `Status ${status.reservation_status_id}`}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="start" 
        className="w-screen max-w-[calc(100vw-2rem)] md:w-[42rem] md:max-w-[42rem] min-h-[32rem] max-h-[calc(100vh-4rem)] p-4 md:p-8 right-0 mr-0 md:mr-8 z-50"
        style={{overflowX: 'visible'}}
      >
        {/* Mobile tabs */}
        <div className="md:hidden flex border-b mb-4">
          <MobileTabButton 
            tab="organizations" 
            icon={<span className="text-xs">🏢</span>} 
            label="Orgs" 
          />
          <MobileTabButton 
            tab="venues" 
            icon={<span className="text-xs">📍</span>} 
            label="Venues" 
          />
          <MobileTabButton 
            tab="equipment" 
            icon={<span className="text-xs">🛠️</span>} 
            label="Equipment" 
          />
          <MobileTabButton 
            tab="status" 
            icon={<span className="text-xs">🔄</span>} 
            label="Status" 
          />
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Organization Filter */}
          <div>
            <div className="font-semibold text-sm mb-1">Organization</div>
            <Command className="border rounded-md" filter={commandOrgFilter}>
              <CommandInput placeholder="Search organization..." />
              <CommandEmpty>No organization found</CommandEmpty>
              <CommandGroup className="max-h-56 overflow-auto">
                {(organizations || []).map((org) => {
                  const checked = organizationFilters.some(o => o.org_id === org.org_id);
                  return (
                    <CommandItem
                      key={org.org_id}
                      value={JSON.stringify({ name: org.org_name, code: org.org_code || '' })}
                      onSelect={() => {
                        if (checked) {
                          setOrganizationFilters(prev => prev.filter(o => o.org_id !== org.org_id));
                        } else {
                          setOrganizationFilters(prev => [...prev, org]);
                        }
                      }}
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox 
                          checked={checked}
                          id={`org-${org.org_id}`}
                        />
                        <span>{org.org_name}</span>
                        {org.org_code && (
                          <span className="text-xs text-muted-foreground ml-auto">{org.org_code}</span>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </div>
          {/* Venue Filter */}
          <div>
            <div className="font-semibold text-sm mb-1">Venue</div>
            <Command className="border rounded-md">
              <CommandInput placeholder="Search venue..." />
              <CommandEmpty>No venue found</CommandEmpty>
              <CommandGroup className="max-h-56 overflow-auto">
                {(venues || []).map((venue) => {
                  const checked = venueFilters.some(v => v.venue_id === venue.venue_id);
                  return (
                    <CommandItem
                      key={venue.venue_id}
                      value={venue.venue_name}
                      onSelect={() => {
                        if (checked) {
                          setVenueFilters(prev => prev.filter(v => v.venue_id !== venue.venue_id));
                        } else {
                          setVenueFilters(prev => [...prev, venue]);
                        }
                      }}
                      className="flex items-center"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Checkbox 
                          checked={checked}
                          id={`venue-${venue.venue_id}`}
                        />
                        <span>{venue.venue_name}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </div>
          {/* Equipment Filter */}
          <div>
            <div className="font-semibold text-sm mb-1">Equipment</div>
            <Command className="border rounded-md">
              <CommandInput
                placeholder="Search equipment..."
                value={equipmentSearchTerm}
                onValueChange={setEquipmentSearchTerm}
              />
              <CommandGroup className="max-h-56 overflow-y-scroll p-2">
                {(equipmentList || [])
                  .filter(eq =>
                    !equipmentSearchTerm ||
                    eq.equipment_name.toLowerCase().includes(equipmentSearchTerm.toLowerCase())
                  )
                  .map((equipment) => (
                    <div key={equipment.equipment_id} className="flex items-center space-x-2 mb-2">
                      <Checkbox 
                        id={`equipment-${equipment.equipment_id}`}
                        checked={equipmentFilters.some(eqf => eqf.equipment_id === equipment.equipment_id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEquipmentFilters(prev => [...prev, equipment]);
                          } else {
                            setEquipmentFilters(prev => 
                              prev.filter(eqf => eqf.equipment_id !== equipment.equipment_id)
                            );
                          }
                        }}
                      />
                      <label 
                        htmlFor={`equipment-${equipment.equipment_id}`}
                        className="text-sm cursor-pointer"
                      >
                        {equipment.equipment_name}
                      </label>
                    </div>
                  ))}
              </CommandGroup>
            </Command>
          </div>
          {/* Status Filter */}
          <div>
            <div className="font-semibold text-sm mb-2">Status</div>
            <div className="grid grid-cols-1 gap-3 max-h-56 overflow-auto border rounded-md p-3">
              {(statuses || []).map((status) => (
                <div key={status.reservation_status_id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`status-${status.reservation_status_id}`}
                    checked={statusFilters.some(st => st.reservation_status_id === status.reservation_status_id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setStatusFilters(prev => [...prev, status]);
                      } else {
                        setStatusFilters(prev => 
                          prev.filter(st => st.reservation_status_id !== status.reservation_status_id)
                        );
                      }
                    }}
                  />
                  <label 
                    htmlFor={`status-${status.reservation_status_id}`}
                    className="text-sm cursor-pointer w-full text-gray-900"
                  >
                    {statusLabelMap[status.reservation_status_id] || status.name || `Status ${status.reservation_status_id}`}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile content */}
        <div className="md:hidden">
          {renderMobileContent()}
        </div>

        {/* Clear All Button */}
        <Button 
          variant="outline" 
          className="mt-6 w-full"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;