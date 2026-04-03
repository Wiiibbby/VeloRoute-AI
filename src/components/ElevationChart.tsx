import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ElevationChartProps {
  elevation: number[];
  distance: number; // total distance in meters
}

export default function ElevationChart({ elevation, distance }: ElevationChartProps) {
  if (!elevation || elevation.length === 0) return null;

  const data = elevation.map((ele, index) => {
    const dist = (index / (elevation.length - 1)) * (distance / 1000); // km
    return {
      distance: dist.toFixed(1),
      elevation: Math.round(ele),
    };
  });

  return (
    <div className="h-48 w-full mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-300 mb-2">Elevation Profile</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorElevation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="distance" 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}km`}
          />
          <YAxis 
            tick={{ fontSize: 10, fill: '#94a3b8' }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => `${val}m`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
            itemStyle={{ color: '#10b981' }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value) => [`${value}m`, 'Elevation']}
            labelFormatter={(label) => `${label} km`}
          />
          <Area 
            type="monotone" 
            dataKey="elevation" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#colorElevation)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
