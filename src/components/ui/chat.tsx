import * as React from "react"
import { cn } from "../../lib/utils"

const Chat = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-4", className)}
    {...props}
  />
))
Chat.displayName = "Chat"

const ChatHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between", className)}
    {...props}
  />
))
ChatHeader.displayName = "ChatHeader"

const ChatTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
))
ChatTitle.displayName = "ChatTitle"

const ChatDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ChatDescription.displayName = "ChatDescription"

const ChatContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto", className)}
    {...props}
  />
))
ChatContent.displayName = "ChatContent"

const ChatFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
ChatFooter.displayName = "ChatFooter"

const ChatMessage = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    isUser?: boolean
  }
>(({ className, isUser = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-4 py-2 text-sm",
      isUser
        ? "ml-auto bg-primary text-primary-foreground"
        : "bg-muted",
      className
    )}
    {...props}
  />
))
ChatMessage.displayName = "ChatMessage"

const ChatMessageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2", className)}
    {...props}
  />
))
ChatMessageHeader.displayName = "ChatMessageHeader"

const ChatMessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm", className)}
    {...props}
  />
))
ChatMessageContent.displayName = "ChatMessageContent"

const ChatMessageFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}
    {...props}
  />
))
ChatMessageFooter.displayName = "ChatMessageFooter"

export {
  Chat,
  ChatHeader,
  ChatTitle,
  ChatDescription,
  ChatContent,
  ChatFooter,
  ChatMessage,
  ChatMessageHeader,
  ChatMessageContent,
  ChatMessageFooter,
} 