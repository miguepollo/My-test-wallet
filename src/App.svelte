<script>
  import NodeConnection from './components/NodeConnection.svelte';
  import WalletCreation from './components/WalletCreation.svelte';
  import WalletDashboard from './components/WalletDashboard.svelte';
  import SendMoneyForm from './components/SendMoneyForm.svelte';
  import ReceiveMoneyForm from './components/ReceiveMoneyForm.svelte';
</script>

<main class="flex flex-col items-center justify-center h-screen bg-gray-100">
  <div class="grid grid-cols-2 gap-6">
    <div>
      <NodeConnection />
      <WalletCreation />
    </div>
    <div>
      <WalletDashboard />
      <div class="flex justify-between mt-6">
        <SendMoneyForm />
        <ReceiveMoneyForm />
      </div>
    </div>
  </div>
</main>
