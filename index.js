const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const axios = require('axios');

// 🔴 Inserta tu token y Client ID aquí
const TOKEN = 'token';
const CLIENT_ID = '1342902515666260039';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Cargar comandos
const commands = [
  {
    name: 'bypass',
    description: 'Bypassea un enlace.',
    options: [
      {
        name: 'link',
        type: 3, // STRING
        description: 'El enlace a bypass',
        required: true
      }
    ]
  }
];

// Registrar comandos en Discord
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ Comandos registrados correctamente.');
  } catch (error) {
    console.error('❌ Error registrando comandos:', error);
  }
})();

// Evento cuando el bot está listo
client.once('ready', () => {
  console.log(`✅ Bot iniciado como ${client.user.tag}`);
});

// Manejo de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === 'bypass') {
    const link = interaction.options.getString('link');

    // Evitar uso en DMs
    if (!interaction.guild) {
      return interaction.reply({ content: 'You cannot use this command in DMs.', ephemeral: true });
    }

    await interaction.deferReply(); // Evita que parezca inactivo

    try {
      const response = await axios.get(`http://fi4.bot-hosting.net:22869/bypass?url=${encodeURIComponent(link)}`);

      if (response.data.success) {
        await interaction.editReply({
          embeds: [{
            title: '✅ | Bypassed Successfully!',
            thumbnail: { url: interaction.user.displayAvatarURL() },
            fields: [{ name: '🔓 Result:', value: `\`${response.data.result}\`` }],
            color: 0x00FF00,
            footer: { text: 'YANZZ | OFFICIAL', icon_url: interaction.client.user.displayAvatarURL() },
            timestamp: new Date()
          }]
        });
      } else {
        throw new Error(response.data.message || 'Bypass failed.');
      }

    } catch (error) {
      await interaction.editReply({
        embeds: [{
          title: '❌ | Bypass Failed!',
          thumbnail: { url: interaction.user.displayAvatarURL() },
          fields: [{ name: '🔒 Error Result:', value: `\`${error.message || 'Unknown error'}\`` }],
          color: 0xFF0000,
          footer: { text: 'YANZZ | OFFICIAL', icon_url: interaction.client.user.displayAvatarURL() },
          timestamp: new Date()
        }]
      });
    }
  }
});

// Iniciar el bot
client.login(TOKEN);
