<script>
  import { receiveMoney } from '../wallet.js';

  let amount = 0;
  let sender = '';

  function handleReceiveMoney() {
    receiveMoney(amount, sender);
    amount = 0;
    sender = '';
  }
</script>

<div class="bg-white shadow-md rounded-lg p-6">
  <h2 class="text-xl font-bold mb-4">Receive Money</h2>
  <form on:submit|preventDefault={handleReceiveMoney}>
    <div class="mb-4">
      <label for="amount" class="block font-bold mb-2">Amount</label>
      <input type="number" id="amount" bind:value={amount} class="input input-bordered w-full max-w-xs" />
    </div>
    <div class="mb-4">
      <label for="sender" class="block font-bold mb-2">Sender</label>
      <input type="text" id="sender" bind:value={sender} class="input input-bordered w-full max-w-xs" />
    </div>
    <button type="submit" class="btn btn-primary">Receive</button>
  </form>
</div>
