import React from 'react';
import { Text, View } from 'react-native';

import { SegmentedControl, SegmentedOption } from '@/src/components/common/SegmentedControl';
import { BillingInterval } from '@/src/types/subscription';

interface BillingIntervalToggleProps {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}

const OPTIONS: SegmentedOption<BillingInterval>[] = [
  { label: 'Mensual', value: 'Monthly' },
  { label: 'Anual', value: 'Annual' },
];

/**
 * Toggle mensual/anual del paywall. Reusa `SegmentedControl` (acento `mono`) y
 * agrega un hint de ahorro cuando se elige el ciclo anual (2 meses gratis).
 */
export const BillingIntervalToggle: React.FC<BillingIntervalToggleProps> = ({ value, onChange }) => (
  <View>
    <SegmentedControl<BillingInterval>
      options={OPTIONS}
      value={value}
      onChange={onChange}
      accent="mono"
    />
    {value === 'Annual' ? (
      <Text className="mt-2 text-center text-xs text-zinc-500">Ahorrás 2 meses pagando anual</Text>
    ) : null}
  </View>
);
