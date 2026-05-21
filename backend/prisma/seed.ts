import { PrismaClient, Position } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// FIFA World Cup 2026 - All 48 Teams
const wc2026Teams = [
  // Group A (USA Host)
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
  { name: 'Panama', code: 'PA', flag: '🇵🇦' },
  // Group B
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  { name: 'Peru', code: 'PE', flag: '🇵🇪' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  // Group C
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  // Group D
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
  // Group E
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'England', code: 'GB-ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  // Group F
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
  // Group G
  { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
  // Group H
  { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
  { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  // Group I
  { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
  // Group J
  { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
  // Group K
  { name: 'Iran', code: 'IR', flag: '🇮🇷' },
  { name: 'Ivory Coast', code: 'CI', flag: '🇨🇮' },
  { name: 'Wales', code: 'GB-WLS', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
  // Group L
  { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
];

const players: Array<{
  name: string; country: string; countryCode: string; position: Position; price: number;
}> = [
  // Argentina
  { name: 'Lionel Messi', country: 'Argentina', countryCode: 'AR', position: 'FWD', price: 12.0 },
  { name: 'Julian Alvarez', country: 'Argentina', countryCode: 'AR', position: 'FWD', price: 9.5 },
  { name: 'Angel Di Maria', country: 'Argentina', countryCode: 'AR', position: 'MID', price: 8.5 },
  { name: 'Rodrigo De Paul', country: 'Argentina', countryCode: 'AR', position: 'MID', price: 8.0 },
  { name: 'Enzo Fernandez', country: 'Argentina', countryCode: 'AR', position: 'MID', price: 9.0 },
  { name: 'Emiliano Martinez', country: 'Argentina', countryCode: 'AR', position: 'GK', price: 8.5 },
  { name: 'Nicolas Otamendi', country: 'Argentina', countryCode: 'AR', position: 'DEF', price: 7.0 },
  { name: 'Lisandro Martinez', country: 'Argentina', countryCode: 'AR', position: 'DEF', price: 8.0 },
  { name: 'Nahuel Molina', country: 'Argentina', countryCode: 'AR', position: 'DEF', price: 7.5 },
  // Brazil
  { name: 'Vinicius Junior', country: 'Brazil', countryCode: 'BR', position: 'FWD', price: 12.0 },
  { name: 'Rodrygo', country: 'Brazil', countryCode: 'BR', position: 'FWD', price: 9.5 },
  { name: 'Endrick', country: 'Brazil', countryCode: 'BR', position: 'FWD', price: 8.5 },
  { name: 'Casemiro', country: 'Brazil', countryCode: 'BR', position: 'MID', price: 8.0 },
  { name: 'Lucas Paqueta', country: 'Brazil', countryCode: 'BR', position: 'MID', price: 9.0 },
  { name: 'Alisson Becker', country: 'Brazil', countryCode: 'BR', position: 'GK', price: 8.5 },
  { name: 'Marquinhos', country: 'Brazil', countryCode: 'BR', position: 'DEF', price: 8.0 },
  { name: 'Militao', country: 'Brazil', countryCode: 'BR', position: 'DEF', price: 7.5 },
  { name: 'Danilo', country: 'Brazil', countryCode: 'BR', position: 'DEF', price: 7.0 },
  // France
  { name: 'Kylian Mbappe', country: 'France', countryCode: 'FR', position: 'FWD', price: 12.0 },
  { name: 'Antoine Griezmann', country: 'France', countryCode: 'FR', position: 'FWD', price: 9.5 },
  { name: 'Ousmane Dembele', country: 'France', countryCode: 'FR', position: 'FWD', price: 9.0 },
  { name: 'Aurelien Tchouameni', country: 'France', countryCode: 'FR', position: 'MID', price: 8.5 },
  { name: 'Eduardo Camavinga', country: 'France', countryCode: 'FR', position: 'MID', price: 8.0 },
  { name: 'Mike Maignan', country: 'France', countryCode: 'FR', position: 'GK', price: 8.0 },
  { name: 'Raphael Varane', country: 'France', countryCode: 'FR', position: 'DEF', price: 7.5 },
  { name: 'Jules Kounde', country: 'France', countryCode: 'FR', position: 'DEF', price: 8.0 },
  { name: 'Theo Hernandez', country: 'France', countryCode: 'FR', position: 'DEF', price: 8.5 },
  // England
  { name: 'Jude Bellingham', country: 'England', countryCode: 'GB-ENG', position: 'MID', price: 11.5 },
  { name: 'Bukayo Saka', country: 'England', countryCode: 'GB-ENG', position: 'FWD', price: 10.5 },
  { name: 'Phil Foden', country: 'England', countryCode: 'GB-ENG', position: 'MID', price: 10.0 },
  { name: 'Harry Kane', country: 'England', countryCode: 'GB-ENG', position: 'FWD', price: 11.0 },
  { name: 'Marcus Rashford', country: 'England', countryCode: 'GB-ENG', position: 'FWD', price: 8.5 },
  { name: 'Jordan Pickford', country: 'England', countryCode: 'GB-ENG', position: 'GK', price: 8.0 },
  { name: 'Trent Alexander-Arnold', country: 'England', countryCode: 'GB-ENG', position: 'DEF', price: 9.0 },
  { name: 'John Stones', country: 'England', countryCode: 'GB-ENG', position: 'DEF', price: 7.5 },
  { name: 'Marc Guehi', country: 'England', countryCode: 'GB-ENG', position: 'DEF', price: 7.0 },
  // Germany
  { name: 'Jamal Musiala', country: 'Germany', countryCode: 'DE', position: 'MID', price: 11.0 },
  { name: 'Florian Wirtz', country: 'Germany', countryCode: 'DE', position: 'MID', price: 10.5 },
  { name: 'Kai Havertz', country: 'Germany', countryCode: 'DE', position: 'FWD', price: 9.5 },
  { name: 'Leroy Sane', country: 'Germany', countryCode: 'DE', position: 'FWD', price: 9.0 },
  { name: 'Joshua Kimmich', country: 'Germany', countryCode: 'DE', position: 'MID', price: 9.0 },
  { name: 'Manuel Neuer', country: 'Germany', countryCode: 'DE', position: 'GK', price: 8.5 },
  { name: 'Antonio Rudiger', country: 'Germany', countryCode: 'DE', position: 'DEF', price: 8.0 },
  { name: 'Nico Schlotterbeck', country: 'Germany', countryCode: 'DE', position: 'DEF', price: 7.5 },
  { name: 'David Raum', country: 'Germany', countryCode: 'DE', position: 'DEF', price: 7.0 },
  // Spain
  { name: 'Lamine Yamal', country: 'Spain', countryCode: 'ES', position: 'FWD', price: 11.5 },
  { name: 'Pedri', country: 'Spain', countryCode: 'ES', position: 'MID', price: 10.0 },
  { name: 'Gavi', country: 'Spain', countryCode: 'ES', position: 'MID', price: 9.5 },
  { name: 'Alvaro Morata', country: 'Spain', countryCode: 'ES', position: 'FWD', price: 8.5 },
  { name: 'Ferran Torres', country: 'Spain', countryCode: 'ES', position: 'FWD', price: 8.5 },
  { name: 'Unai Simon', country: 'Spain', countryCode: 'ES', position: 'GK', price: 8.0 },
  { name: 'Dani Carvajal', country: 'Spain', countryCode: 'ES', position: 'DEF', price: 8.5 },
  { name: 'Robin Le Normand', country: 'Spain', countryCode: 'ES', position: 'DEF', price: 7.0 },
  { name: 'Marc Cucurella', country: 'Spain', countryCode: 'ES', position: 'DEF', price: 7.5 },
  // Portugal
  { name: 'Cristiano Ronaldo', country: 'Portugal', countryCode: 'PT', position: 'FWD', price: 11.5 },
  { name: 'Bruno Fernandes', country: 'Portugal', countryCode: 'PT', position: 'MID', price: 10.5 },
  { name: 'Joao Felix', country: 'Portugal', countryCode: 'PT', position: 'FWD', price: 9.5 },
  { name: 'Rafael Leao', country: 'Portugal', countryCode: 'PT', position: 'FWD', price: 9.5 },
  { name: 'Ruben Neves', country: 'Portugal', countryCode: 'PT', position: 'MID', price: 8.0 },
  { name: 'Diogo Costa', country: 'Portugal', countryCode: 'PT', position: 'GK', price: 8.0 },
  { name: 'Pepe', country: 'Portugal', countryCode: 'PT', position: 'DEF', price: 7.0 },
  { name: 'Ruben Dias', country: 'Portugal', countryCode: 'PT', position: 'DEF', price: 8.5 },
  { name: 'Joao Cancelo', country: 'Portugal', countryCode: 'PT', position: 'DEF', price: 8.0 },
  // Netherlands
  { name: 'Cody Gakpo', country: 'Netherlands', countryCode: 'NL', position: 'FWD', price: 10.0 },
  { name: 'Virgil van Dijk', country: 'Netherlands', countryCode: 'NL', position: 'DEF', price: 9.5 },
  { name: 'Frenkie de Jong', country: 'Netherlands', countryCode: 'NL', position: 'MID', price: 9.0 },
  { name: 'Xavi Simons', country: 'Netherlands', countryCode: 'NL', position: 'MID', price: 9.5 },
  { name: 'Donyell Malen', country: 'Netherlands', countryCode: 'NL', position: 'FWD', price: 8.5 },
  { name: 'Bart Verbruggen', country: 'Netherlands', countryCode: 'NL', position: 'GK', price: 7.5 },
  { name: 'Jurrien Timber', country: 'Netherlands', countryCode: 'NL', position: 'DEF', price: 8.0 },
  { name: 'Denzel Dumfries', country: 'Netherlands', countryCode: 'NL', position: 'DEF', price: 7.5 },
  // Belgium
  { name: 'Kevin De Bruyne', country: 'Belgium', countryCode: 'BE', position: 'MID', price: 11.0 },
  { name: 'Romelu Lukaku', country: 'Belgium', countryCode: 'BE', position: 'FWD', price: 9.5 },
  { name: 'Leandro Trossard', country: 'Belgium', countryCode: 'BE', position: 'MID', price: 8.5 },
  { name: 'Yannick Carrasco', country: 'Belgium', countryCode: 'BE', position: 'MID', price: 8.0 },
  { name: 'Koen Casteels', country: 'Belgium', countryCode: 'BE', position: 'GK', price: 7.5 },
  { name: 'Jan Vertonghen', country: 'Belgium', countryCode: 'BE', position: 'DEF', price: 7.0 },
  { name: 'Toby Alderweireld', country: 'Belgium', countryCode: 'BE', position: 'DEF', price: 7.0 },
  // Croatia
  { name: 'Luka Modric', country: 'Croatia', countryCode: 'HR', position: 'MID', price: 10.0 },
  { name: 'Ivan Perisic', country: 'Croatia', countryCode: 'HR', position: 'MID', price: 8.5 },
  { name: 'Andrej Kramaric', country: 'Croatia', countryCode: 'HR', position: 'FWD', price: 8.0 },
  { name: 'Dominik Livakovic', country: 'Croatia', countryCode: 'HR', position: 'GK', price: 7.5 },
  { name: 'Josip Gvardiol', country: 'Croatia', countryCode: 'HR', position: 'DEF', price: 8.5 },
  { name: 'Dejan Lovren', country: 'Croatia', countryCode: 'HR', position: 'DEF', price: 7.0 },
  // Italy
  { name: 'Federico Chiesa', country: 'Italy', countryCode: 'IT', position: 'FWD', price: 9.5 },
  { name: 'Nicolo Barella', country: 'Italy', countryCode: 'IT', position: 'MID', price: 9.0 },
  { name: 'Gianluca Scamacca', country: 'Italy', countryCode: 'IT', position: 'FWD', price: 8.5 },
  { name: 'Marco Verratti', country: 'Italy', countryCode: 'IT', position: 'MID', price: 8.0 },
  { name: 'Gianluigi Donnarumma', country: 'Italy', countryCode: 'IT', position: 'GK', price: 9.0 },
  { name: 'Alessandro Bastoni', country: 'Italy', countryCode: 'IT', position: 'DEF', price: 8.0 },
  { name: 'Giovanni Di Lorenzo', country: 'Italy', countryCode: 'IT', position: 'DEF', price: 7.5 },
  // Morocco
  { name: 'Hakim Ziyech', country: 'Morocco', countryCode: 'MA', position: 'MID', price: 9.0 },
  { name: 'Achraf Hakimi', country: 'Morocco', countryCode: 'MA', position: 'DEF', price: 9.5 },
  { name: 'Youssef En-Nesyri', country: 'Morocco', countryCode: 'MA', position: 'FWD', price: 8.5 },
  { name: 'Sofyan Amrabat', country: 'Morocco', countryCode: 'MA', position: 'MID', price: 8.0 },
  { name: 'Yassine Bounou', country: 'Morocco', countryCode: 'MA', position: 'GK', price: 8.0 },
  { name: 'Noussair Mazraoui', country: 'Morocco', countryCode: 'MA', position: 'DEF', price: 7.5 },
  // Senegal
  { name: 'Sadio Mane', country: 'Senegal', countryCode: 'SN', position: 'FWD', price: 10.5 },
  { name: 'Idrissa Gueye', country: 'Senegal', countryCode: 'SN', position: 'MID', price: 7.5 },
  { name: 'Ismaila Sarr', country: 'Senegal', countryCode: 'SN', position: 'FWD', price: 8.0 },
  { name: 'Edouard Mendy', country: 'Senegal', countryCode: 'SN', position: 'GK', price: 8.0 },
  { name: 'Kalidou Koulibaly', country: 'Senegal', countryCode: 'SN', position: 'DEF', price: 8.5 },
  // Nigeria
  { name: 'Victor Osimhen', country: 'Nigeria', countryCode: 'NG', position: 'FWD', price: 11.0 },
  { name: 'Wilfried Ndidi', country: 'Nigeria', countryCode: 'NG', position: 'MID', price: 7.5 },
  { name: 'Alex Iwobi', country: 'Nigeria', countryCode: 'NG', position: 'MID', price: 8.0 },
  { name: 'Francis Uzoho', country: 'Nigeria', countryCode: 'NG', position: 'GK', price: 7.0 },
  { name: 'William Troost-Ekong', country: 'Nigeria', countryCode: 'NG', position: 'DEF', price: 7.5 },
  // Japan
  { name: 'Takumi Minamino', country: 'Japan', countryCode: 'JP', position: 'FWD', price: 8.5 },
  { name: 'Wataru Endo', country: 'Japan', countryCode: 'JP', position: 'MID', price: 8.0 },
  { name: 'Ritsu Doan', country: 'Japan', countryCode: 'JP', position: 'MID', price: 8.5 },
  { name: 'Shuichi Gonda', country: 'Japan', countryCode: 'JP', position: 'GK', price: 7.0 },
  { name: 'Maya Yoshida', country: 'Japan', countryCode: 'JP', position: 'DEF', price: 7.0 },
  // South Korea
  { name: 'Son Heung-min', country: 'South Korea', countryCode: 'KR', position: 'FWD', price: 11.0 },
  { name: 'Hwang Hee-chan', country: 'South Korea', countryCode: 'KR', position: 'FWD', price: 8.5 },
  { name: 'Lee Kang-in', country: 'South Korea', countryCode: 'KR', position: 'MID', price: 9.0 },
  { name: 'Kim Seung-gyu', country: 'South Korea', countryCode: 'KR', position: 'GK', price: 7.0 },
  { name: 'Kim Min-jae', country: 'South Korea', countryCode: 'KR', position: 'DEF', price: 8.5 },
  // USA
  { name: 'Christian Pulisic', country: 'United States', countryCode: 'US', position: 'FWD', price: 10.0 },
  { name: 'Weston McKennie', country: 'United States', countryCode: 'US', position: 'MID', price: 8.0 },
  { name: 'Tyler Adams', country: 'United States', countryCode: 'US', position: 'MID', price: 7.5 },
  { name: 'Matt Turner', country: 'United States', countryCode: 'US', position: 'GK', price: 7.0 },
  { name: 'Sergino Dest', country: 'United States', countryCode: 'US', position: 'DEF', price: 7.5 },
  // Mexico
  { name: 'Hirving Lozano', country: 'Mexico', countryCode: 'MX', position: 'FWD', price: 9.0 },
  { name: 'Raul Jimenez', country: 'Mexico', countryCode: 'MX', position: 'FWD', price: 9.0 },
  { name: 'Andres Guardado', country: 'Mexico', countryCode: 'MX', position: 'MID', price: 7.5 },
  { name: 'Guillermo Ochoa', country: 'Mexico', countryCode: 'MX', position: 'GK', price: 7.5 },
  { name: 'Hector Moreno', country: 'Mexico', countryCode: 'MX', position: 'DEF', price: 7.0 },
  // Uruguay
  { name: 'Darwin Nunez', country: 'Uruguay', countryCode: 'UY', position: 'FWD', price: 10.5 },
  { name: 'Federico Valverde', country: 'Uruguay', countryCode: 'UY', position: 'MID', price: 10.0 },
  { name: 'Luis Suarez', country: 'Uruguay', countryCode: 'UY', position: 'FWD', price: 8.5 },
  { name: 'Sergio Rochet', country: 'Uruguay', countryCode: 'UY', position: 'GK', price: 7.0 },
  { name: 'Ronald Araujo', country: 'Uruguay', countryCode: 'UY', position: 'DEF', price: 8.5 },
  // Colombia
  { name: 'Luis Diaz', country: 'Colombia', countryCode: 'CO', position: 'FWD', price: 10.5 },
  { name: 'James Rodriguez', country: 'Colombia', countryCode: 'CO', position: 'MID', price: 9.0 },
  { name: 'Radamel Falcao', country: 'Colombia', countryCode: 'CO', position: 'FWD', price: 7.5 },
  { name: 'David Ospina', country: 'Colombia', countryCode: 'CO', position: 'GK', price: 7.0 },
  { name: 'Davinson Sanchez', country: 'Colombia', countryCode: 'CO', position: 'DEF', price: 7.5 },
  // Denmark
  { name: 'Christian Eriksen', country: 'Denmark', countryCode: 'DK', position: 'MID', price: 9.5 },
  { name: 'Kasper Dolberg', country: 'Denmark', countryCode: 'DK', position: 'FWD', price: 8.0 },
  { name: 'Pierre-Emile Hojbjerg', country: 'Denmark', countryCode: 'DK', position: 'MID', price: 8.0 },
  { name: 'Kasper Schmeichel', country: 'Denmark', countryCode: 'DK', position: 'GK', price: 8.0 },
  { name: 'Simon Kjaer', country: 'Denmark', countryCode: 'DK', position: 'DEF', price: 7.5 },
  // Switzerland
  { name: 'Xherdan Shaqiri', country: 'Switzerland', countryCode: 'CH', position: 'FWD', price: 8.5 },
  { name: 'Granit Xhaka', country: 'Switzerland', countryCode: 'CH', position: 'MID', price: 8.5 },
  { name: 'Yann Sommer', country: 'Switzerland', countryCode: 'CH', position: 'GK', price: 8.0 },
  { name: 'Nico Elvedi', country: 'Switzerland', countryCode: 'CH', position: 'DEF', price: 7.0 },
  { name: 'Manuel Akanji', country: 'Switzerland', countryCode: 'CH', position: 'DEF', price: 8.0 },
  // Iran
  { name: 'Mehdi Taremi', country: 'Iran', countryCode: 'IR', position: 'FWD', price: 9.0 },
  { name: 'Sardar Azmoun', country: 'Iran', countryCode: 'IR', position: 'FWD', price: 8.5 },
  { name: 'Alireza Jahanbakhsh', country: 'Iran', countryCode: 'IR', position: 'MID', price: 8.0 },
  { name: 'Ali Beiranvand', country: 'Iran', countryCode: 'IR', position: 'GK', price: 7.0 },
  { name: 'Shoja Khalilzadeh', country: 'Iran', countryCode: 'IR', position: 'DEF', price: 6.5 },
  // Turkey
  { name: 'Arda Guler', country: 'Turkey', countryCode: 'TR', position: 'MID', price: 9.5 },
  { name: 'Hakan Calhanoglu', country: 'Turkey', countryCode: 'TR', position: 'MID', price: 9.0 },
  { name: 'Cenk Tosun', country: 'Turkey', countryCode: 'TR', position: 'FWD', price: 7.5 },
  { name: 'Ugurcan Cakir', country: 'Turkey', countryCode: 'TR', position: 'GK', price: 7.0 },
  { name: 'Merih Demiral', country: 'Turkey', countryCode: 'TR', position: 'DEF', price: 7.5 },
  // Ivory Coast
  { name: 'Didier Drogba Jr', country: 'Ivory Coast', countryCode: 'CI', position: 'FWD', price: 7.5 },
  { name: 'Franck Kessie', country: 'Ivory Coast', countryCode: 'CI', position: 'MID', price: 8.5 },
  { name: 'Nicolas Pepe', country: 'Ivory Coast', countryCode: 'CI', position: 'FWD', price: 8.0 },
  { name: 'Badra Ali Sangare', country: 'Ivory Coast', countryCode: 'CI', position: 'GK', price: 6.5 },
  { name: 'Eric Bailly', country: 'Ivory Coast', countryCode: 'CI', position: 'DEF', price: 7.5 },
  // Ghana
  { name: 'Mohammed Kudus', country: 'Ghana', countryCode: 'GH', position: 'MID', price: 9.0 },
  { name: 'Jordan Ayew', country: 'Ghana', countryCode: 'GH', position: 'FWD', price: 8.0 },
  { name: 'Andre Ayew', country: 'Ghana', countryCode: 'GH', position: 'MID', price: 7.5 },
  { name: 'Lawrence Ati-Zigi', country: 'Ghana', countryCode: 'GH', position: 'GK', price: 6.5 },
  { name: 'Daniel Amartey', country: 'Ghana', countryCode: 'GH', position: 'DEF', price: 7.0 },
  // Poland
  { name: 'Robert Lewandowski', country: 'Poland', countryCode: 'PL', position: 'FWD', price: 11.5 },
  { name: 'Piotr Zielinski', country: 'Poland', countryCode: 'PL', position: 'MID', price: 8.5 },
  { name: 'Arkadiusz Milik', country: 'Poland', countryCode: 'PL', position: 'FWD', price: 8.0 },
  { name: 'Wojciech Szczesny', country: 'Poland', countryCode: 'PL', position: 'GK', price: 8.5 },
  { name: 'Jan Bednarek', country: 'Poland', countryCode: 'PL', position: 'DEF', price: 7.5 },
  // Australia
  { name: 'Martin Boyle', country: 'Australia', countryCode: 'AU', position: 'FWD', price: 7.5 },
  { name: 'Aaron Mooy', country: 'Australia', countryCode: 'AU', position: 'MID', price: 7.5 },
  { name: 'Mathew Leckie', country: 'Australia', countryCode: 'AU', position: 'MID', price: 7.5 },
  { name: 'Mat Ryan', country: 'Australia', countryCode: 'AU', position: 'GK', price: 7.0 },
  { name: 'Milos Degenek', country: 'Australia', countryCode: 'AU', position: 'DEF', price: 6.5 },
  // Saudi Arabia
  { name: 'Salem Al-Dawsari', country: 'Saudi Arabia', countryCode: 'SA', position: 'FWD', price: 8.5 },
  { name: 'Saleh Al-Shehri', country: 'Saudi Arabia', countryCode: 'SA', position: 'FWD', price: 7.5 },
  { name: 'Mohammed Al-Owais', country: 'Saudi Arabia', countryCode: 'SA', position: 'GK', price: 7.0 },
  { name: 'Ali Al-Bulayhi', country: 'Saudi Arabia', countryCode: 'SA', position: 'DEF', price: 6.5 },
  // Serbia
  { name: 'Aleksandar Mitrovic', country: 'Serbia', countryCode: 'RS', position: 'FWD', price: 9.5 },
  { name: 'Dusan Vlahovic', country: 'Serbia', countryCode: 'RS', position: 'FWD', price: 10.0 },
  { name: 'Sergej Milinkovic-Savic', country: 'Serbia', countryCode: 'RS', position: 'MID', price: 9.0 },
  { name: 'Predrag Rajkovic', country: 'Serbia', countryCode: 'RS', position: 'GK', price: 7.0 },
  { name: 'Nikola Milenkovic', country: 'Serbia', countryCode: 'RS', position: 'DEF', price: 7.5 },
  // Wales
  { name: 'Gareth Bale', country: 'Wales', countryCode: 'GB-WLS', position: 'FWD', price: 9.0 },
  { name: 'Aaron Ramsey', country: 'Wales', countryCode: 'GB-WLS', position: 'MID', price: 8.0 },
  { name: 'Daniel James', country: 'Wales', countryCode: 'GB-WLS', position: 'FWD', price: 7.5 },
  { name: 'Wayne Hennessey', country: 'Wales', countryCode: 'GB-WLS', position: 'GK', price: 7.0 },
  { name: 'Chris Mepham', country: 'Wales', countryCode: 'GB-WLS', position: 'DEF', price: 6.5 },
];

// Group Stage matches for WC 2026 (48 matches)
const groupMatches = [
  // Group A
  { home: 'United States', away: 'Mexico', group: 'A', daysOffset: 0 },
  { home: 'Uruguay', away: 'Panama', group: 'A', daysOffset: 0 },
  { home: 'United States', away: 'Uruguay', group: 'A', daysOffset: 4 },
  { home: 'Mexico', away: 'Panama', group: 'A', daysOffset: 4 },
  { home: 'Mexico', away: 'Uruguay', group: 'A', daysOffset: 8 },
  { home: 'Panama', away: 'United States', group: 'A', daysOffset: 8 },
  // Group B
  { home: 'Argentina', away: 'Chile', group: 'B', daysOffset: 1 },
  { home: 'Peru', away: 'Australia', group: 'B', daysOffset: 1 },
  { home: 'Argentina', away: 'Peru', group: 'B', daysOffset: 5 },
  { home: 'Chile', away: 'Australia', group: 'B', daysOffset: 5 },
  { home: 'Chile', away: 'Peru', group: 'B', daysOffset: 9 },
  { home: 'Australia', away: 'Argentina', group: 'B', daysOffset: 9 },
  // Group C
  { home: 'Germany', away: 'Japan', group: 'C', daysOffset: 1 },
  { home: 'Costa Rica', away: 'Indonesia', group: 'C', daysOffset: 1 },
  { home: 'Germany', away: 'Costa Rica', group: 'C', daysOffset: 5 },
  { home: 'Japan', away: 'Indonesia', group: 'C', daysOffset: 5 },
  { home: 'Japan', away: 'Costa Rica', group: 'C', daysOffset: 9 },
  { home: 'Indonesia', away: 'Germany', group: 'C', daysOffset: 9 },
  // Group D
  { home: 'Spain', away: 'Brazil', group: 'D', daysOffset: 2 },
  { home: 'Switzerland', away: 'Cameroon', group: 'D', daysOffset: 2 },
  { home: 'Spain', away: 'Switzerland', group: 'D', daysOffset: 6 },
  { home: 'Brazil', away: 'Cameroon', group: 'D', daysOffset: 6 },
  { home: 'Brazil', away: 'Switzerland', group: 'D', daysOffset: 10 },
  { home: 'Cameroon', away: 'Spain', group: 'D', daysOffset: 10 },
  // Group E
  { home: 'France', away: 'England', group: 'E', daysOffset: 2 },
  { home: 'Algeria', away: 'New Zealand', group: 'E', daysOffset: 2 },
  { home: 'France', away: 'Algeria', group: 'E', daysOffset: 6 },
  { home: 'England', away: 'New Zealand', group: 'E', daysOffset: 6 },
  { home: 'England', away: 'Algeria', group: 'E', daysOffset: 10 },
  { home: 'New Zealand', away: 'France', group: 'E', daysOffset: 10 },
  // Group F
  { home: 'Portugal', away: 'Netherlands', group: 'F', daysOffset: 3 },
  { home: 'Nigeria', away: 'Iraq', group: 'F', daysOffset: 3 },
  { home: 'Portugal', away: 'Nigeria', group: 'F', daysOffset: 7 },
  { home: 'Netherlands', away: 'Iraq', group: 'F', daysOffset: 7 },
  { home: 'Netherlands', away: 'Nigeria', group: 'F', daysOffset: 11 },
  { home: 'Iraq', away: 'Portugal', group: 'F', daysOffset: 11 },
  // Group G
  { home: 'Belgium', away: 'Italy', group: 'G', daysOffset: 3 },
  { home: 'Saudi Arabia', away: 'Ecuador', group: 'G', daysOffset: 3 },
  { home: 'Belgium', away: 'Saudi Arabia', group: 'G', daysOffset: 7 },
  { home: 'Italy', away: 'Ecuador', group: 'G', daysOffset: 7 },
  { home: 'Italy', away: 'Saudi Arabia', group: 'G', daysOffset: 11 },
  { home: 'Ecuador', away: 'Belgium', group: 'G', daysOffset: 11 },
  // Group H
  { home: 'Croatia', away: 'Senegal', group: 'H', daysOffset: 4 },
  { home: 'Colombia', away: 'Morocco', group: 'H', daysOffset: 4 },
  { home: 'Croatia', away: 'Colombia', group: 'H', daysOffset: 8 },
  { home: 'Senegal', away: 'Morocco', group: 'H', daysOffset: 8 },
  { home: 'Senegal', away: 'Colombia', group: 'H', daysOffset: 12 },
  { home: 'Morocco', away: 'Croatia', group: 'H', daysOffset: 12 },
];

async function main() {
  console.log('🌍 Seeding World Cup Fantasy 2026 database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('Admin@2026!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@worldcupfantasy.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@worldcupfantasy.com',
      password: hashedPassword,
      isAdmin: true,
      avatar: '👑',
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // Create demo user
  const demoHash = await bcrypt.hash('Demo@2026!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@worldcupfantasy.com' },
    update: {},
    create: {
      name: 'Demo Player',
      email: 'demo@worldcupfantasy.com',
      password: demoHash,
      avatar: '⚽',
    },
  });
  console.log(`✅ Demo user created: ${demoUser.email}`);

  // Seed players
  let playerCount = 0;
  for (const p of players) {
    await prisma.player.upsert({
      where: { id: `player-${p.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: { price: p.price },
      create: {
        id: `player-${p.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: p.name,
        country: p.country,
        countryCode: p.countryCode,
        position: p.position,
        price: p.price,
      },
    });
    playerCount++;
  }
  console.log(`✅ ${playerCount} players seeded`);

  // Seed matches
  const startDate = new Date('2026-06-11T18:00:00Z');
  let matchCount = 0;
  for (const m of groupMatches) {
    const kickoff = new Date(startDate);
    kickoff.setDate(startDate.getDate() + m.daysOffset);
    const id = `match-${m.home.toLowerCase().replace(/\s+/g, '-')}-vs-${m.away.toLowerCase().replace(/\s+/g, '-')}`;
    await prisma.match.upsert({
      where: { id },
      update: {},
      create: {
        id,
        homeTeam: m.home,
        awayTeam: m.away,
        group: m.group,
        round: 'Group Stage',
        kickoffTime: kickoff,
        status: 'UPCOMING',
        venue: 'MetLife Stadium',
        city: 'East Rutherford, NJ',
      },
    });
    matchCount++;
  }
  console.log(`✅ ${matchCount} matches seeded`);
  console.log('🎉 Database seeding complete!');
  console.log('');
  console.log('📧 Admin login: admin@worldcupfantasy.com / Admin@2026!');
  console.log('📧 Demo login:  demo@worldcupfantasy.com / Demo@2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
