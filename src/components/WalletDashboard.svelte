<script>
  import { sendMoney, receiveMoney } from '../wallet.js';

  let balance = 1000;
  let transactionHistory = [
    { id: 1, type: 'send', amount: 50, recipient: 'John Doe' },
    { id: 2, type: 'receive', amount: 75, sender: 'Jane Smith' },
  ];

  function handleSendMoney(amount, recipient) {
    sendMoney(amount, recipient);
    balance -= amount;
    transactionHistory = [
      { id: transactionHistory.length + 1, type: 'send', amount, recipient },
      ...transactionHistory,
    ];
  }

  function handleReceiveMoney(amount, sender) {
    receiveMoney(amount, sender);
    balance += amount;
    transactionHistory = [
      { id: transactionHistory.length + 1, type: 'receive', amount, sender },
      ...transactionHistory,
    ];
  }
</script>

<main class="bg-white shadow-md rounded-lg p-6">
  <h1 class="text-2xl font-bold mb-4">Wallet Dashboard</h1>
  <p class="text-4xl font-bold mb-6">Balance: ${ balance.toFixed(2) }</p>

  <div class="mb-6">
    <h2 class="text-xl font-bold mb-2">Send Money</h2>
    <form on:submit|preventDefault={ () => handleSendMoney(50, 'John Doe') }>
      <input type="number" placeholder="Amount" class="input input-bordered w-full max-w-xs mb-2" />
      <input type="text" placeholder="Recipient" class="input input-bordered w-full max-w-xs mb-2" />
      <button type="submit" class="btn btn-primary">Send</button>
    </form>
  </div>

  <div>
    <h2 class="text-xl font-bold mb-2">Receive Money</h2>
    <form on:submit|preventDefault={ () => handleReceiveMoney(75, 'Jane Smith') }>
      <input type="number" placeholder="Amount" class="input input-bordered w-full max-w-xs mb-2" />
      <input type="text" placeholder="Sender" class="input input-bordered w-full max-w-xs mb-2" />
      <button type="submit" class="btn btn-primary">Receive</button>
    </form>
  </div>

  <div class="mt-6">
    <h2 class="text-xl font-bold mb-2">Transaction History</h2>
    <ul>
      {#each transactionHistory as transaction}
        <li class="flex justify-between items-center mb-2">
          <span class:text-green-500={ transaction.type === 'receive' } class:text-red-500={ transaction.type === 'send' }>
            { transaction.type === 'receive' ? 'Received' : 'Sent' } ${ transaction.amount.toFixed(2) }
          </span>
          <span>{ transaction.type === 'receive' ? 'from' : 'to' } { transaction.sender || transaction.recipient }</span>
        </li>
      {/each}
    </ul>
  </div>
</main>
