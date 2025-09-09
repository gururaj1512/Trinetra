

export interface Hospital {
  id: string;
  name: string;
  type: 'hospital' | 'medical' | 'clinic';
  latitude: number;
  longitude: number;
  address: string;
  phone: string;
  distance: number;
  rating: number;
  website?: string;
  openingHours?: string;
  specialties?: string[];
  emergency?: boolean;
  insurance?: string[];
}

export interface HospitalSearchParams {
  latitude: number;
  longitude: number;
  radius?: number; // in kilometers
  type?: string;
  limit?: number;
}

class HospitalService {
  private readonly GOOGLE_PLACES_API_KEY = 'AIzaSyBIOC5weP0UHUucbi4EwAMAk-ollFzJ5nA'; // From your app.json
  private readonly OPENSTREETMAP_BASE_URL = 'https://overpass-api.de/api/interpreter';

  /**
   * Fetch nearby hospitals using Google Places API with enhanced phone number fetching
   */
  async fetchNearbyHospitals(params: HospitalSearchParams): Promise<Hospital[]> {
    try {
      const { latitude, longitude, radius = 10, type = 'hospital', limit = 20 } = params;
      
      // Google Places API endpoint for nearby search
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius * 1000}&type=${type}&key=${this.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn('Google Places API error:', data.status);
        // Fallback to OpenStreetMap
        return this.fetchFromOpenStreetMap(params);
      }

      const hospitals: Hospital[] = [];
      
      // Process each place and get detailed information including phone numbers
      for (let i = 0; i < Math.min(data.results.length, limit); i++) {
        const place = data.results[i];
        const distance = this.calculateDistance(
          latitude, 
          longitude, 
          place.geometry.location.lat, 
          place.geometry.location.lng
        );

        // Get detailed information including phone number
        let phoneNumber = place.formatted_phone_number || 'Phone not available';
        let website = place.website;
        let openingHours = place.opening_hours?.open_now ? 'Open Now' : 'Closed';

        // If we don't have phone number, try to get it from place details
        if (!place.formatted_phone_number && place.place_id) {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,opening_hours&key=${this.GOOGLE_PLACES_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.status === 'OK' && detailsData.result) {
              phoneNumber = detailsData.result.formatted_phone_number || phoneNumber;
              website = detailsData.result.website || website;
              openingHours = detailsData.result.opening_hours?.open_now ? 'Open Now' : 'Closed';
            }
          } catch (error) {
            console.warn('Failed to fetch place details:', error);
          }
        }

        // Generate unique ID to prevent duplicates
        const uniqueId = place.place_id ? 
          `${place.place_id}_${type}_${i}` : 
          `google_${type}_${Date.now()}_${i}`;

        hospitals.push({
          id: uniqueId,
          name: place.name,
          type: this.categorizePlaceType(place.types),
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          address: place.vicinity || 'Address not available',
          phone: phoneNumber,
          distance: Math.round(distance * 100) / 100,
          rating: place.rating || 0,
          website: website,
          openingHours: openingHours,
          specialties: this.extractSpecialties(place.types),
          emergency: place.types.includes('hospital') || place.types.includes('emergency'),
          insurance: []
        });
      }

      // Sort by distance
      return hospitals.sort((a, b) => a.distance - b.distance);

    } catch (error) {
      console.error('Error fetching from Google Places:', error);
      // Fallback to OpenStreetMap
      return this.fetchFromOpenStreetMap(params);
    }
  }

  /**
   * Fetch all types of medical facilities with duplicate prevention
   */
  async fetchAllMedicalFacilities(params: HospitalSearchParams): Promise<Hospital[]> {
    try {
      const { latitude, longitude, radius = 15, limit = 50 } = params;
      
      console.log('Fetching hospitals and medical clinics data...');
      
      // Fetch hospitals (60% of total)
      const hospitals = await this.fetchNearbyHospitals({
        ...params,
        type: 'hospital',
        limit: Math.floor(limit * 0.6)
      });

      // Fetch clinics and medical offices (40% of total)
      const clinics = await this.fetchNearbyHospitals({
        ...params,
        type: 'doctor',
        limit: Math.floor(limit * 0.4)
      });

      // Combine hospitals and clinics only
      const allFacilities = [...hospitals, ...clinics];
      const uniqueFacilities = this.removeDuplicates(allFacilities);
      
      // Sort by distance and limit
      const sortedFacilities = uniqueFacilities
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      console.log(`Successfully fetched ${sortedFacilities.length} unique medical facilities:`, {
        hospitals: sortedFacilities.filter(h => h.type === 'hospital').length,
        clinics: sortedFacilities.filter(h => h.type === 'clinic').length
      });

      return sortedFacilities;

    } catch (error) {
      console.error('Error fetching medical facilities:', error);
      return this.fetchFromOpenStreetMap(params);
    }
  }

  /**
   * Remove duplicate facilities based on coordinates and name similarity
   */
  private removeDuplicates(facilities: Hospital[]): Hospital[] {
    const seen = new Map<string, Hospital>();
    
    return facilities.filter(facility => {
      // Create a unique key based on coordinates (rounded to 4 decimal places for proximity)
      const latKey = Math.round(facility.latitude * 10000) / 10000;
      const lngKey = Math.round(facility.longitude * 10000) / 10000;
      const coordKey = `${latKey}_${lngKey}`;
      
      // Check if we already have a facility at this location
      if (seen.has(coordKey)) {
        const existing = seen.get(coordKey)!;
        // Keep the one with better information (has phone, rating, etc.)
        if (this.hasBetterInfo(facility, existing)) {
          seen.set(coordKey, facility);
          return true;
        }
        return false;
      }
      
      seen.set(coordKey, facility);
      return true;
    });
  }

  /**
   * Determine which facility has better information
   */
  private hasBetterInfo(newFacility: Hospital, existingFacility: Hospital): boolean {
    let newScore = 0;
    let existingScore = 0;
    
    // Score based on available information
    if (newFacility.phone !== 'Phone not available') newScore += 2;
    if (existingFacility.phone !== 'Phone not available') existingScore += 2;
    
    if (newFacility.rating > 0) newScore += 1;
    if (existingFacility.rating > 0) existingScore += 1;
    
    if (newFacility.website) newScore += 1;
    if (existingFacility.website) existingScore += 1;
    
    if (newFacility.specialties && newFacility.specialties.length > 0) newScore += 1;
    if (existingFacility.specialties && existingFacility.specialties.length > 0) existingScore += 1;
    
    return newScore > existingScore;
  }

  /**
   * Fallback method using OpenStreetMap Overpass API
   */
  private async fetchFromOpenStreetMap(params: HospitalSearchParams): Promise<Hospital[]> {
    try {
      const { latitude, longitude, radius = 10, limit = 20 } = params;
      
      // Overpass query for medical facilities
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:${radius * 1000},${latitude},${longitude});
          node["amenity"="clinic"](around:${radius * 1000},${latitude},${longitude});
          node["amenity"="doctors"](around:${radius * 1000},${latitude},${longitude});
          way["amenity"="hospital"](around:${radius * 1000},${latitude},${longitude});
          way["amenity"="clinic"](around:${radius * 1000},${latitude},${longitude});
          way["amenity"="doctors"](around:${radius * 1000},${latitude},${longitude});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch(this.OPENSTREETMAP_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        return this.getFallbackHospitals(params);
      }

      const hospitals: Hospital[] = data.elements
        .filter((element: any) => element.tags && element.tags.name)
        .map((element: any, index: number) => {
          const distance = this.calculateDistance(
            latitude,
            longitude,
            element.lat || element.center?.lat,
            element.lon || element.center?.lon
          );

          return {
            id: `osm_${element.id || index}_${Date.now()}`,
            name: element.tags.name,
            type: this.categorizeOSMType(element.tags.amenity),
            latitude: element.lat || element.center?.lat,
            longitude: element.lon || element.center?.lon,
            address: element.tags['addr:street'] ? 
              `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}, ${element.tags['addr:city'] || ''}`.trim() :
              'Address not available',
            phone: element.tags.phone || element.tags['contact:phone'] || 'Phone not available',
            distance: Math.round(distance * 100) / 100,
            rating: 0, // OSM doesn't provide ratings
            website: element.tags.website || element.tags['contact:website'],
            openingHours: element.tags.opening_hours || 'Hours not available',
            specialties: this.extractOSMSpecialties(element.tags),
            emergency: element.tags.emergency === 'yes' || element.tags.amenity === 'hospital',
            insurance: []
          };
        })
        .filter((hospital: Hospital) => hospital.latitude && hospital.longitude)
        .sort((a: Hospital, b: Hospital) => a.distance - b.distance)
        .slice(0, limit);

      return hospitals.length > 0 ? hospitals : this.getFallbackHospitals(params);

    } catch (error) {
      console.error('Error fetching from OpenStreetMap:', error);
      return this.getFallbackHospitals(params);
    }
  }

  /**
   * Get hospital details including phone, website, and opening hours
   */
  async getHospitalDetails(placeId: string): Promise<Partial<Hospital>> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_phone_number,website,opening_hours,reviews&key=${this.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        return {
          phone: data.result.formatted_phone_number || 'Phone not available',
          website: data.result.website,
          openingHours: data.result.opening_hours?.open_now ? 'Open Now' : 'Closed',
          rating: data.result.rating || 0
        };
      }

      return {};
    } catch (error) {
      console.error('Error fetching hospital details:', error);
      return {};
    }
  }

  /**
   * Search hospitals by name or specialty
   */
  async searchHospitals(query: string, params: HospitalSearchParams): Promise<Hospital[]> {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${params.latitude},${params.longitude}&radius=${(params.radius || 10) * 1000}&key=${this.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        return [];
      }

      const hospitals: Hospital[] = [];
      
      // Process each search result to get phone numbers
      for (let i = 0; i < data.results.length; i++) {
        const place = data.results[i];
        const distance = this.calculateDistance(
          params.latitude,
          params.longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        );

        // Get detailed information including phone number
        let phoneNumber = place.formatted_phone_number || 'Phone not available';
        let website = place.website;
        let openingHours = place.opening_hours?.open_now ? 'Open Now' : 'Closed';

        // If we don't have phone number, try to get it from place details
        if (!place.formatted_phone_number && place.place_id) {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=formatted_phone_number,website,opening_hours&key=${this.GOOGLE_PLACES_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.status === 'OK' && detailsData.result) {
              phoneNumber = detailsData.result.formatted_phone_number || phoneNumber;
              website = detailsData.result.website || website;
              openingHours = detailsData.result.opening_hours?.open_now ? 'Open Now' : 'Closed';
            }
          } catch (error) {
            console.warn('Failed to fetch place details:', error);
          }
        }

        // Generate unique ID for search results
        const uniqueId = place.place_id ? 
          `search_${place.place_id}_${i}` : 
          `search_${Date.now()}_${i}`;

        hospitals.push({
          id: uniqueId,
          name: place.name,
          type: this.categorizePlaceType(place.types),
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          address: place.formatted_address || place.vicinity || 'Address not available',
          phone: phoneNumber,
          distance: Math.round(distance * 100) / 100,
          rating: place.rating || 0,
          website: website,
          openingHours: openingHours,
          specialties: this.extractSpecialties(place.types),
          emergency: place.types.includes('hospital') || place.types.includes('emergency'),
          insurance: []
        });
      }

      return hospitals.sort((a: Hospital, b: Hospital) => a.distance - b.distance);

    } catch (error) {
      console.error('Error searching hospitals:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Categorize Google Places types
   */
  private categorizePlaceType(types: string[]): Hospital['type'] {
    if (types.includes('hospital')) return 'hospital';
    if (types.includes('clinic') || types.includes('doctor')) return 'clinic';
    return 'medical';
  }

  /**
   * Categorize OSM amenity types
   */
  private categorizeOSMType(amenity: string): Hospital['type'] {
    switch (amenity) {
      case 'hospital': return 'hospital';
      case 'clinic': return 'clinic';
      case 'doctors': return 'clinic';
      default: return 'medical';
    }
  }

  /**
   * Extract specialties from Google Places types
   */
  private extractSpecialties(types: string[]): string[] {
    const specialties: string[] = [];
    
    if (types.includes('hospital')) specialties.push('General Hospital');
    if (types.includes('emergency')) specialties.push('Emergency Care');
    if (types.includes('pediatric')) specialties.push('Pediatrics');
    if (types.includes('cardiology')) specialties.push('Cardiology');
    if (types.includes('orthopedic')) specialties.push('Orthopedics');
    if (types.includes('dental')) specialties.push('Dental Care');
    if (types.includes('urgent_care')) specialties.push('Urgent Care');
    
    return specialties;
  }

  /**
   * Extract specialties from OSM tags
   */
  private extractOSMSpecialties(tags: any): string[] {
    const specialties: string[] = [];
    
    if (tags.amenity === 'hospital') specialties.push('General Hospital');
    if (tags.emergency === 'yes') specialties.push('Emergency Care');
    if (tags.speciality) specialties.push(tags.speciality);
    if (tags.healthcare) specialties.push(tags.healthcare);
    if (tags.urgent_care === 'yes') specialties.push('Urgent Care');
    
    return specialties;
  }

  /**
   * Fallback hospitals when APIs fail
   */
  private getFallbackHospitals(params: HospitalSearchParams): Hospital[] {
    const { latitude, longitude } = params;
    
    return [
      {
        id: `fallback_1_${Date.now()}`,
        name: 'Emergency Medical Center',
        type: 'hospital',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
        address: 'Emergency services available',
        phone: 'Call 911 for emergencies',
        distance: 0.8,
        rating: 0,
        emergency: true,
        specialties: ['Emergency Care'],
        insurance: []
      },
      {
        id: `fallback_2_${Date.now()}`,
        name: 'Local Medical Clinic',
        type: 'clinic',
        latitude: latitude - 0.008,
        longitude: longitude + 0.015,
        address: 'General medical services',
        phone: 'Contact local directory',
        distance: 1.2,
        rating: 0,
        emergency: false,
        specialties: ['General Practice'],
        insurance: []
      }
    ];
  }
}

export default new HospitalService();
