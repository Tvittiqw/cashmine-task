import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { colors } from '../components/theme';
import { Card, ErrorState, Screen, styles } from '../components/ui';
import { useDisplayBalances } from '../features/balances/useDisplayBalances';
import { checkClaim } from '../features/claims/claimValidation';
import { ClaimForm } from '../features/claims/components/ClaimForm';
import { ClaimReview } from '../features/claims/components/ClaimReview';
import { PendingClaim } from '../features/claims/components/PendingClaim';
import type { SubmitOutcome } from '../features/claims/submitClaim';
import { useClaimOptions } from '../features/claims/useClaimOptions';
import { useClaimSubmission } from '../features/claims/useClaimSubmission';
import { userMessage } from '../lib/api/apiClient';
import { formatUnits } from '../lib/money';

type Step = 'form' | 'review';

export default function ClaimScreen() {
  const params = useLocalSearchParams<{ asset?: string }>();
  const { query: balancesQuery, balances } = useDisplayBalances();
  const submission = useClaimSubmission();

  const [asset, setAsset] = useState(params.asset);
  const [pickedDestination, setPickedDestination] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [step, setStep] = useState<Step>('form');

  const selected = balances?.find((b) => b.asset === asset) ?? balances?.[0];
  const options = useClaimOptions(selected?.asset);

  const afterSend = (outcome: SubmitOutcome | null) => {
    if (outcome?.kind === 'created') router.replace(`/claims/${outcome.claim.id}`);
    else if (outcome?.kind === 'rejected') setStep('form');
  };

  if (submission.intent) {
    return (
      <Screen>
        <PendingClaim
          intent={submission.intent}
          submitting={submission.submitting}
          onCheck={() => void submission.recheck().then(afterSend)}
          onDismiss={() => {
            submission.dismiss();
            router.replace('/');
          }}
        />
      </Screen>
    );
  }

  if (!balances) {
    return (
      <Screen>
        {balancesQuery.isError ? (
          <ErrorState message={userMessage(balancesQuery.error)} onRetry={() => void balancesQuery.refetch()} />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </Screen>
    );
  }

  if (!selected) {
    return (
      <Screen>
        <Card>
          <Text style={styles.muted}>There is nothing to claim yet.</Text>
        </Card>
      </Screen>
    );
  }

  const destinations = options.data?.destinations ?? [];
  // D7: preselect only when there is a single destination.
  const destinationId = destinations.length === 1 ? destinations[0].id : pickedDestination;
  const destinationLabel = destinations.find((d) => d.id === destinationId)?.label;
  const check = options.data ? checkClaim(input, selected, options.data) : null;
  const valid = check?.result?.ok ? check.result : null;

  if (step === 'review' && valid && options.data && destinationId) {
    return (
      <Screen>
        <ClaimReview
          asset={selected.asset}
          decimals={selected.decimals}
          usdPrice={selected.usdPrice}
          amount={valid.amount}
          receive={valid.receive}
          fee={options.data.fee}
          destinationLabel={destinationLabel ?? destinationId}
          submitting={submission.submitting}
          onBack={() => setStep('form')}
          onConfirm={() =>
            void submission
              .submit({ asset: selected.asset, amount: formatUnits(valid.amount, selected.decimals), destinationId })
              .then(afterSend)
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ClaimForm
        balances={balances}
        selected={selected}
        onSelectAsset={(next) => {
          setAsset(next);
          setPickedDestination(null);
          setInput('');
          submission.clearError();
        }}
        options={options.data}
        optionsError={
          options.isError
            ? { message: userMessage(options.error), retrying: options.isFetching, onRetry: () => void options.refetch() }
            : null
        }
        destinationId={destinationId}
        onSelectDestination={setPickedDestination}
        input={input}
        onChangeInput={(value) => {
          setInput(value);
          submission.clearError();
        }}
        check={check}
        serverError={submission.error}
        canReview={!!valid && !!destinationId}
        onReview={() => {
          void options.refetch(); // pick up any fee/min change before confirming
          setStep('review');
        }}
      />
    </Screen>
  );
}
