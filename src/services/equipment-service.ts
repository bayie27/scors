import { supabase } from '@/supabase-client';
import { Equipment, CreateEquipmentDTO, UpdateEquipmentDTO } from '@/types/equipment';

export const equipmentService = {
  // Get all equipment
  async getEquipment(): Promise<Equipment[]> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('equipment_name');
    if (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
    return data || [];
  },

  // Get a single equipment by ID
  async getEquipmentById(id: number): Promise<Equipment | null> {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('equipment_id', id)
      .single();
    if (error) {
      console.error(`Error fetching equipment ${id}:`, error);
      throw error;
    }
    return data;
  },

  // Create a new equipment
  async createEquipment(equipmentData: CreateEquipmentDTO): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .insert({ ...equipmentData })
      .select()
      .single();
    if (error) {
      console.error('Error creating equipment:', error);
      throw error;
    }
    return data;
  },

  // Update an existing equipment
  async updateEquipment({ equipment_id, ...updates }: UpdateEquipmentDTO): Promise<Equipment> {
    const { data, error } = await supabase
      .from('equipment')
      .update({ ...updates })
      .eq('equipment_id', equipment_id)
      .select()
      .single();
    if (error) {
      console.error(`Error updating equipment ${equipment_id}:`, error);
      throw error;
    }
    return data;
  },

  // Delete an equipment
  async deleteEquipment(id: number): Promise<void> {
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('equipment_id', id);
    if (error) {
      console.error(`Error deleting equipment ${id}:`, error);
      throw error;
    }
  },

  // Subscribe to equipment changes
  subscribeToEquipment(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('public:equipment')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment',
        },
        (payload) => callback(payload)
      )
      .subscribe();
    return () => {
      subscription.unsubscribe();
    };
  },
};
