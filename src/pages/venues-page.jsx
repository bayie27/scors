import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Search as SearchIcon, 
  Filter, 
  Users as PeopleIcon, 
  MapPin as MapPinIcon, 
  Projector, 
  AudioLines, 
  Wifi, 
  SquareDashed, 
  SquareStack, 
  Monitor, 
  Clipboard, 
  AirVent, 
  Book 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { supabase } from '@/supabase-client';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// Simple image carousel for venue modal
function VenueImageCarousel({ images = [] }) {
  const [idx, setIdx] = useState(0);
  if (!images.length) return null;
  const goPrev = (e) => { e.stopPropagation(); setIdx(idx === 0 ? images.length - 1 : idx - 1); };
  const goNext = (e) => { e.stopPropagation(); setIdx(idx === images.length - 1 ? 0 : idx + 1); };
  return (
    <div className="relative w-full h-64 bg-black">
      <img src={images[idx]} alt="Venue" className="w-full h-64 object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={goPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-8 h-8 flex items-center justify-center shadow">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <span key={i} className={`block w-2 h-2 rounded-full ${i === idx ? 'bg-white' : 'bg-white/50'}`}></span>
          ))}
        </div>
      )}
    </div>
  );
}

// Map amenity names to Lucide icons
function AmenityIcon({ name, ...props }) {
  switch ((name || '').toLowerCase()) {
    case 'projector': return <Projector {...props} />;
    case 'whiteboard': return <Clipboard {...props} />;
    case 'ac': return <AirVent {...props} />;
    case 'wifi': return <Wifi {...props} />;
    case 'audio': return <AudioLines {...props} />;
    case 'monitor': return <Monitor {...props} />;
    case 'book': return <Book {...props} />;
    default: return <SquareDashed {...props} />;
  }
}

// Map equipment names to Lucide icons
function EquipmentIcon({ name, ...props }) {
  switch ((name || '').toLowerCase()) {
    case 'projector & screen': return <Projector {...props} />;
    case 'audio system': return <AudioLines {...props} />;
    case 'high-speed wifi': return <Wifi {...props} />;
    default: return <SquareStack {...props} />;
  }
}


export function VenuesPage() {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const subscriptionRef = useRef(null);

  const fetchVenues = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error: supabaseError } = await supabase
        .from('venue')
        .select('*');
      
      if (supabaseError) {
        // Error from Supabase
        throw supabaseError;
      }
      // Transform data to match our expected format
      const formattedVenues = Array.isArray(data) ? data.map(venue => ({
        ...venue,
        // Ensure we have all required fields with defaults if needed
        status: venue?.status || 'available',
        amenities: venue?.amenities || [],
        image_url: venue?.image_url || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80'
      })) : [];
      setVenues(formattedVenues);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Display error toast without logging specific error details
      toast.error('Failed to load venues');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupSubscription = useCallback(async () => {
    try {
      // Clean up any existing subscription first
      if (subscriptionRef.current) {
        await subscriptionRef.current.unsubscribe();
      }
      
      // Create new subscription to the venue table
      const channel = supabase.channel('public:venues', {
        config: {
          broadcast: { self: true },
          presence: { key: 'venue-management' },
        },
      });
      
      channel
        .on('presence', { event: 'sync' }, () => {
          
        })
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'venue' }, 
          () => {
            fetchVenues();
          }
        );
      
      // Subscribe to the channel
      await channel.subscribe((status) => {
        console.log(`Venue subscription status: ${status}`);
        if (status === 'SUBSCRIBED') {
          // Force a refresh when subscription is established
          fetchVenues().catch(error => {
            console.error('Error refreshing after subscription:', error);
            toast.error('Failed to refresh venues after subscription');
          });
        }
      });
      
      // Store the subscription reference
      subscriptionRef.current = channel;
      
    } catch (error) {
      console.error('Error setting up venue subscription:', error);
      toast.error('Failed to set up real-time updates');
      throw error; // Re-throw to be caught by the useEffect
    }
  }, [fetchVenues]);

  // Set up real-time subscription
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await fetchVenues();
        if (isMounted) {
          const cleanup = setupSubscription();
          return cleanup; // Return cleanup function
        }
      } catch (error) {
        console.error('Initialization error:', error);
        toast.error('Failed to initialize venues');
      }
    };

    const cleanup = init();
    
    // Clean up subscription when component unmounts
    return () => {
      isMounted = false;
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(fn => fn && fn());
      } else if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [fetchVenues, setupSubscription]);

  // Filter venues based on search query
  const filteredVenues = venues.filter(venue => 
    (venue.venue_name && venue.venue_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.description && venue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (venue.amenities && Array.isArray(venue.amenities) && venue.amenities.some(a => typeof a === 'string' && a.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-4 mb-6">
        <h1 className="text-2xl font-bold">Venue Management</h1>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Right section: Search Bar + Add Venue */}
          <div className="ml-auto flex items-center gap-2">
            {/* Search pill - icon only by default, expands to input on click */}
            <div className="h-10 flex items-center">
              <div
                className={`flex items-center transition-all duration-300 ease-in-out cursor-pointer overflow-hidden group ${isSearchExpanded ? 'border border-gray-200 shadow-sm bg-white rounded-full w-64 px-4 py-2 justify-start' : 'w-10 h-10 p-0 justify-center border-0 shadow-none bg-none'}`}
                onClick={() => {
                  if (!isSearchExpanded) {
                    setIsSearchExpanded(true);
                    setTimeout(() => searchInputRef.current && searchInputRef.current.focus(), 100);
                  }
                }}
                tabIndex={0}
                onBlur={e => {
                  // Only collapse if clicking outside
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsSearchExpanded(false);
                  }
                }}
                style={{ transform: 'translateZ(0)' }} /* Force GPU acceleration */
              >
                <SearchIcon className={`h-5 w-5 text-gray-500 flex-shrink-0 transition-all duration-300 ease-in-out ${isSearchExpanded ? 'ml-0' : 'mx-auto'} ${!isSearchExpanded ? '!bg-none !shadow-none !rounded-none' : ''}`} />
                <div className={`relative flex-1 transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'}`}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search"
                    className={`bg-transparent outline-none border-none text-sm placeholder-gray-400 w-full ml-2 ${isSearchExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    style={{ minWidth: 0 }}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onFocus={() => setIsSearchExpanded(true)}
                  />
                </div>
                <button
                  tabIndex={0}
                  onClick={e => {
                    e.stopPropagation();
                    setSearchQuery('');
                    searchInputRef.current && searchInputRef.current.focus();
                  }}
                  className={`ml-2 text-gray-400 hover:text-gray-600 focus:outline-none transition-all duration-300 ease-in-out ${isSearchExpanded && searchQuery ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto whitespace-nowrap"
              onClick={() => alert('Add Venue functionality will be implemented soon')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </div>
        </div>
      </div>

      {/* Venues Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : filteredVenues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <Card key={venue.venue_id} className="overflow-hidden h-full flex flex-col hover:shadow-md relative">
              {/* Venue Image - Clickable */}
              <div className="relative h-48 overflow-hidden group cursor-pointer" onClick={() => setSelectedVenue(venue)}>
                <img 
                  src={venue.image_url} 
                  alt={venue.venue_name} 
                  className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 right-2 z-10 flex space-x-1">
                  <Button size="icon" variant="ghost" className="bg-white h-8 w-8 p-0 shadow-sm hover:bg-gray-100">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                    </svg>
                  </Button>
                  <Button size="icon" variant="ghost" className="bg-white h-8 w-8 p-0 shadow-sm hover:bg-red-50 group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-red-500 group-hover:text-red-600" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </Button>
                </div>
              </div>
              
              <CardHeader className="pb-0 pt-4 px-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold">
                    {venue.venue_name}
                  </CardTitle>
                  <Badge className={venue.status === 'available' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'} variant="secondary">
                    {venue.status === 'available' ? 'Available' : 'Maintenance'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-0 pt-1 px-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <span>{venue.capacity || 12}</span>
                  <span className="mx-2">•</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <span>{venue.location || 'Ground Floor, Building A'}</span>
                </div>
                
                <p className="text-xs text-gray-700 mb-3 line-clamp-2">
                  {venue.description || 'Perfect for small team meetings and presentations with modern amenities'}
                </p>
                
                <div className="flex flex-wrap gap-2 mt-auto pt-1 pb-4">
                  {venue.amenities && venue.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-gray-100 text-black font-semibold text-xs px-3 py-1"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No venues found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search or filter criteria' : 'Get started by creating a new venue'}
          </p>
          <div className="mt-6">
            <Button
              onClick={() => alert('Add Venue functionality will be implemented soon')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </div>
        </div>
      )}

      {/* Venue Modal */}
      {selectedVenue && (
        <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
            <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground" onClick={() => setSelectedVenue(null)}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              <span className="sr-only">Close</span>
            </button>
            
            {/* Image Carousel */}
            <div className="relative">


            </div>
          </DialogContent>
        </Dialog>
      )}
      {selectedVenue && (
        <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
          <DialogContent className="max-w-2xl w-full p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-2 text-left border-b">
              <DialogTitle className="text-lg font-bold text-gray-900">{selectedVenue.venue_name}</DialogTitle>
            </div>
            
            {/* Image Carousel */}
            <div className="px-6 pb-4">
              <div className="overflow-hidden rounded-lg">
                <VenueImageCarousel images={
  Array.isArray(selectedVenue.images)
    ? selectedVenue.images
    : typeof selectedVenue.images === 'string' && selectedVenue.images.includes(',')
      ? selectedVenue.images.split(',').map(img => img.trim())
      : selectedVenue.images
        ? [selectedVenue.images]
        : [selectedVenue.image_url]
} />
              </div>
            </div>
      
      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Details & Description */}
          <div>
            {/* Details */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Details</h3>
              <div className="flex items-center gap-2 mb-2">
                <PeopleIcon className="text-gray-400" size={16} />
                <span className="text-xs">Capacity: {selectedVenue.capacity || 12} people</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <MapPinIcon className="text-gray-400" size={16} />
                <span className="text-xs">Ground Floor, Building A</span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs">Status:</span>
                <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available
                </span>
              </div>
            </div>
            {/* Description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-1">Description</h3>
              <p className="text-xs text-gray-600">
                {selectedVenue.description || 'Perfect for small team meetings and presentations with modern amenities'}
              </p>
            </div>
          </div>
          {/* Right column: Amenities & Equipment */}
          <div className="pl-8">
            {/* Amenities */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Amenities</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {(selectedVenue.amenities || ['Projector', 'Whiteboard', 'AC']).map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600"></span>
                    <span className="text-xs">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Equipment */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Equipment Available</h3>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V8c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v1"></path><path d="M2 13v2c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-2"></path><path d="M18 11V8c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v3"></path><path d="M18 15v1c0 .6.4 1 1 1h2c.6 0 1-.4 1-1v-1"></path><path d="M8 9h1"></path><path d="M10 9h6"></path><path d="M17 9h-1"></path><path d="M8 13h1"></path><path d="M10 13h6"></path><path d="M17 13h-1"></path><path d="M9 17h6"></path></svg>
                  <span className="text-xs">Projector & Screen</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 2v20"></path><path d="M8 2v20"></path><path d="M12 14v.01"></path><path d="M22 8h-4"></path><path d="M6 8H2"></path><path d="M22 16h-4"></path><path d="M6 16H2"></path><path d="M18 12h.01"></path><path d="M6 12h.01"></path></svg>
                  <span className="text-xs">Audio System</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                  <span className="text-xs">High-Speed WiFi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setSelectedVenue(null)}>Close</Button>
          <Button variant="outline" size="sm" className="text-xs h-8 flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
            Edit Venue
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
      )}
    </div>
  );
}
