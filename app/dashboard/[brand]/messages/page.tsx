import { getMessages } from "@/app/actions/messages"
import MessagesView from "@/components/messages-view"

export default async function MessagesPage() {
    const result = await getMessages()
    const messages = result.success && result.data ? result.data : []

    return <MessagesView messages={messages} />
}
