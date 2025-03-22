import got from 'got'

export interface DnsRecord {
  name: string
  type: string
  ttl: number
  value: string
}

const DNS_TYPE_NUMBERS: { [key: number]: string } = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  24: 'SIG',
  25: 'KEY',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA'
}

export async function getDNSRecords(name: string): Promise<DnsRecord[]> {
  const result = await got
    .get('https://dns.google/resolve', {
      searchParams: {
        name
      }
    })
    .json<any>()

  return (result.Answer || [])
    .map((row: any) => ({
      name: row.name.replace(/\.$/, ''),
      type: DNS_TYPE_NUMBERS[row.type] || String(row.type),
      ttl: row.TTL,
      value: row.data.replace(/\.$/, '')
    }))
    .filter((row: any) => row.name === name)
}
