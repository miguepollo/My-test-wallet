<script>
  import { sendMoney } from '../wallet.js';

  let amount = 0;
  let recipient = '';

  function handleSendMoney() {
    sendMoney(amount, recipient);
    amount = 0;
    recipient = '';
  }
</script>

<div class="bg-white shadow-md rounded-lg p-6">
  <h2 class="text-xl font-bold mb-4">Send Money</h2>
  <form on:submit|preventDefault={handleSendMoney}>
    <div class="mb-4">
      <label for="amount" class="block font-bold mb-2">Amount</label>
      <input type="number" id="amount" bind:value={amount} class="input input-bordered w-full max-w-xs" />
    </div>
    <div class="mb-4">
      <label for="recipient" class="block font-bold mb-2">Recipient</label>
      <input type="text" id="recipient" bind:value={recipient} class="input input-bordered w-full max-w-xs" />
    </div>
    <button type="submit" class="btn btn-primary">Send</button>
  </form>
</div>
