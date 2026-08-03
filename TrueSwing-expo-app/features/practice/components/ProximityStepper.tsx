import { Minus, Plus } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { formatProximity, PROXIMITY_STEP, stepProximity } from '../utils/drillMetric';

type Props = {
    value: number;
    unit: string;
    onChange: (value: number) => void;
    disabled?: boolean;
};

/**
 * Enter a continuous measurement: average distance to the hole.
 *
 * The number grid cannot serve this one. "4.2 feet" is not a value out of ten, and the
 * useful resolution is tenths — the difference between 4.2 and 4.3 is the kind of progress
 * a lag-putting drill exists to show, and rounding to whole feet would flatten a season of
 * it into four values.
 *
 * So: one hero numeral, minus and plus either side. Two large targets instead of eleven
 * small ones, and holding either accelerates through the range.
 */
export default function ProximityStepper({ value, unit, onChange, disabled = false }: Props) {
    const atFloor = value <= 0;

    return (
        <View className="w-full items-center">
            <View className="flex-row items-center justify-center gap-6">
                <StepButton
                    label={`Less by ${PROXIMITY_STEP} ${unit}`}
                    disabled={disabled || atFloor}
                    onPress={() => onChange(stepProximity(value, -1))}
                >
                    <Minus size={26} color="#EADFC8" />
                </StepButton>

                <View className="min-w-[132px] flex-row items-baseline justify-center">
                    <Text className="text-[68px] leading-[76px] font-display-bold text-sand">
                        {formatProximity(value)}
                    </Text>
                    <Text className="ml-2 text-xl font-sans-medium text-sand-dim">{unit}</Text>
                </View>

                <StepButton
                    label={`More by ${PROXIMITY_STEP} ${unit}`}
                    disabled={disabled}
                    onPress={() => onChange(stepProximity(value, 1))}
                >
                    <Plus size={26} color="#EADFC8" />
                </StepButton>
            </View>
        </View>
    );
}

function StepButton({
    label,
    disabled,
    onPress,
    children,
}: {
    label: string;
    disabled: boolean;
    onPress: () => void;
    children: React.ReactNode;
}) {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            disabled={disabled}
            // Repeat-on-hold: crossing a ten-foot range one tenth at a time is 100 taps
            // otherwise, and this screen is meant to take seconds.
            onLongPress={onPress}
            delayLongPress={300}
            onPress={onPress}
            className={`h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-ink-raised active:bg-white/10 ${
                disabled ? 'opacity-30' : ''
            }`}
        >
            {children}
        </Pressable>
    );
}
