import { PBXData } from '@/types';
import HealthCard from './HealthCard';

interface FleetGridProps {
  pbxData: PBXData[];
  onEditPBX: (pbx: PBXData) => void;
}

export default function FleetGrid({ pbxData, onEditPBX }: FleetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {pbxData.map((pbx) => (
        <HealthCard
          key={pbx.id}
          pbx={pbx}
          onEdit={() => onEditPBX(pbx)}
        />
      ))}
    </div>
  );
}