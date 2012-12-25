!function($){

    "use strict"; // jshint ;_;


    /* TYPEAHEAD PUBLIC CLASS DEFINITION
  * ================================= */

    var Typeahead = function (element, options) {
        this.$element = $(element)
        this.options = $.extend({}, $.fn.typeahead.defaults, options)
        this.matcher = this.options.matcher || this.matcher//允许自定义matcher函数
        this.sorter = this.options.sorter || this.sorter//允许自定义sorter函数
        this.highlighter = this.options.highlighter || this.highlighter//允许自定义highlighter函数
        this.updater = this.options.updater || this.updater//允许自定义updater函数
        this.source = this.options.source
        this.$menu = $(this.options.menu)//UL
        this.shown = false
        this.listen()
    }

    Typeahead.prototype = {

        constructor: Typeahead

        , 
        select: function () {
            var val = this.$menu.find('.active').attr('data-value')
            this.$element
            .val(this.updater(val))
            .change()
            return this.hide()
        }

        , 
        updater: function (item) {
            return item
        }

        , 
        show: function () {
            var pos = $.extend({}, this.$element.position(), {
                height: this.$element[0].offsetHeight
            })

            this.$menu
            .insertAfter(this.$element)
            .css({
                top: pos.top + pos.height
                , 
                left: pos.left
            })
            .show()

            this.shown = true
            return this
        }

        , 
        hide: function () {
            this.$menu.hide()
            this.shown = false
            return this
        }

        , 
        lookup: function (event) {
            var items

            this.query = this.$element.val()
            //取得用户输入内容
            if (!this.query || this.query.length < this.options.minLength) {
                return this.shown ? this.hide() : this
            }

            items = $.isFunction(this.source) ? this.source(this.query, $.proxy(this.process, this)) : this.source
console.log(items)
            return items ? this.process(items) : this
        }

        , 
        process: function (items) {
            var that = this
            //取得符合条件的
            items = $.grep(items, function (item) {
                return that.matcher(item)
            })
            //将相关度最高的放在前面
            items = this.sorter(items)

            if (!items.length) {
                return this.shown ? this.hide() : this
            }
            //然后重新生成LI中的元素 this.options.items为个数，这句字起得不好
            return this.render(items.slice(0, this.options.items)).show()
        }

        , 
        matcher: function (item) {//判定是否存在，不区分大小写
            return ~item.toLowerCase().indexOf(this.query.toLowerCase())
        }

        , 
        sorter: function (items) {//排序，按beginswith，caseSensitive，caseInsensitive排列
            var beginswith = []
            , caseSensitive = []
            , caseInsensitive = []
            , item

            while (item = items.shift()) {
                if (!item.toLowerCase().indexOf(this.query.toLowerCase())) beginswith.push(item)
                else if (~item.indexOf(this.query)) caseSensitive.push(item)
                else caseInsensitive.push(item)
            }

            return beginswith.concat(caseSensitive, caseInsensitive)
        }

        , 
        highlighter: function (item) {//item是用户输入
            var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&')//这是将字符串安全格式化为正则表达式的源码
            return item.replace(new RegExp('(' + query + ')', 'ig'), function ($1, match) {
                return '<strong>' + match + '</strong>'//将下拉列表中符合项中的LI的innerHTML相等部分加个strong标签
            })
        }

        , 
        render: function (items) {
            var that = this

            items = $(items).map(function (i, item) {
                i = $(that.options.item).attr('data-value', item)
                i.find('a').html(that.highlighter(item))
                return i[0]
            })

            items.first().addClass('active')
            this.$menu.html(items)
            return this
        }

        , //向下移动
        next: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
            , next = active.next()

            if (!next.length) {
                next = $(this.$menu.find('li')[0])
            }

            next.addClass('active')
        }

        , //向上移动
        prev: function (event) {
            var active = this.$menu.find('.active').removeClass('active')
            , prev = active.prev()

            if (!prev.length) {
                prev = this.$menu.find('li').last()
            }

            prev.addClass('active')
        }

        , 
        listen: function () {
            this.$element
            .on('blur',     $.proxy(this.blur, this))
            .on('keypress', $.proxy(this.keypress, this))
            .on('keyup',    $.proxy(this.keyup, this))

            if (this.eventSupported('keydown')) {
                this.$element.on('keydown', $.proxy(this.keydown, this))
            }

            this.$menu
            .on('click', $.proxy(this.click, this))
            .on('mouseenter', 'li', $.proxy(this.mouseenter, this))
        }
        //一个事件检测函数，不应该放在原型上
        , 
        eventSupported: function(eventName) {
            var isSupported = eventName in this.$element
            if (!isSupported) {
                this.$element.setAttribute(eventName, 'return;')
                isSupported = typeof this.$element[eventName] === 'function'
            }
            return isSupported
        }

        , 
        move: function (e) {
            if (!this.shown) return

            switch(e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault()
                    break

                case 38: // up arrow
                    e.preventDefault()
                    this.prev()
                    break

                case 40: // down arrow
                    e.preventDefault()
                    this.next()
                    break
            }

            e.stopPropagation()
        }

        , 
        keydown: function (e) {//先执行keydown再到keypress
            this.suppressKeyPressRepeat = ~$.inArray(e.keyCode, [40,38,9,13,27])
            this.move(e)
        }

        , 
        keypress: function (e) {
            if (this.suppressKeyPressRepeat) return
            this.move(e)
        }

        , 
        keyup: function (e) {
            switch(e.keyCode) {
                //这几个在keydown时已经处理了
                case 40: // down arrow
                case 38: // up arrow
                case 16: // shift
                case 17: // ctrl
                case 18: // alt
                    break

                case 9: // tab
                case 13: // enter
                    if (!this.shown) return
                    this.select()
                    break

                case 27: // escape
                    if (!this.shown) return
                    this.hide()
                    break

                default:
                    this.lookup()
            }

            e.stopPropagation()
            e.preventDefault()
        }

        , 
        blur: function (e) {//隐藏提示菜单
            var that = this
            setTimeout(function () {
                that.hide()
            }, 150)
        }

        , 
        click: function (e) {//防止回车提交表单
            e.stopPropagation()
            e.preventDefault()
            this.select()
        }

        , 
        mouseenter: function (e) {
            this.$menu.find('.active').removeClass('active')
            $(e.currentTarget).addClass('active')
        }

    }


    /* TYPEAHEAD PLUGIN DEFINITION
   * =========================== */

    var old = $.fn.typeahead

    $.fn.typeahead = function (option) {
        return this.each(function () {
            var $this = $(this)
            , data = $this.data('typeahead')
            , options = typeof option == 'object' && option
            if (!data) $this.data('typeahead', (data = new Typeahead(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.typeahead.defaults = {
        source: []
        , 
        items: 8
        , 
        menu: '<ul class="typeahead dropdown-menu"></ul>'
        , 
        item: '<li><a href="#"></a></li>'
        , 
        minLength: 1
    }

    $.fn.typeahead.Constructor = Typeahead


    /* TYPEAHEAD NO CONFLICT
  * =================== */

    $.fn.typeahead.noConflict = function () {
        $.fn.typeahead = old
        return this
    }


    /* TYPEAHEAD DATA-API
  * ================== */

    $(document).on('focus.typeahead.data-api', '[data-provide="typeahead"]', function (e) {
        var $this = $(this)
        if ($this.data('typeahead')) return
        e.preventDefault()
        $this.typeahead($this.data())//取得所有data-*属性并转换为更有意义的数据
    })

}(window.jQuery);